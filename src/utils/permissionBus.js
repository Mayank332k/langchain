const EventEmitter = require('events');
const path = require('path');
const os = require('os');

function getWhitelistTarget(toolName, args) {
  if (!args) return '';
  if (args.command) return args.command;
  if (args.dirPath) return path.resolve(args.dirPath);
  if (args.filePath) {
    const absolute = path.resolve(args.filePath);
    const cwd = process.cwd();
    if (absolute.startsWith(cwd)) {
      return cwd;
    }
    const home = os.homedir();
    const desktop = path.join(home, 'Desktop');
    if (absolute.startsWith(desktop)) {
      const relativeToDesktop = path.relative(desktop, absolute);
      const parts = relativeToDesktop.split(path.sep);
      if (parts.length > 1) {
        return path.join(desktop, parts[0]);
      }
    }
    return absolute;
  }
  return '';
}

class PermissionBus extends EventEmitter {
  constructor() {
    super();
    // Increase limit if multiple tools request concurrently, though unlikely in a sequential agent
    this.setMaxListeners(10);
    this.whitelistedTools = new Set();
  }

  _getWhitelistKey(toolName, args) {
    const target = getWhitelistTarget(toolName, args);
    return target ? `${toolName}:${target}` : toolName;
  }

  /**
   * Request permission from the user via the UI.
   * @param {string} toolName - The name of the tool requesting permission
   * @param {object} args - The arguments passed to the tool
   * @returns {Promise<boolean>} - Resolves to true if approved, false if denied
   */
  requestPermission(toolName, args) {
    const key = this._getWhitelistKey(toolName, args);
    const target = getWhitelistTarget(toolName, args);

    if (this.whitelistedTools.has(key)) {
      return Promise.resolve(true);
    }

    return new Promise((resolve) => {
      this.emit('request', {
        toolName,
        args,
        target,
        resolve: (response) => {
          if (response === 'always') {
            this.whitelistedTools.add(key);
            resolve(true);
          } else {
            resolve(response === true);
          }
        }
      });
    });
  }
}

// Export a singleton instance
const permissionBus = new PermissionBus();
module.exports = permissionBus;
