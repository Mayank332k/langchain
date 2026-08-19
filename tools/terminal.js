const { DynamicStructuredTool } = require("@langchain/core/tools");
const { z } = require("zod");
const { exec } = require("child_process");
const util = require("util");
const execPromise = util.promisify(exec);
const permissionBus = require("../src/utils/permissionBus");

/**
 * Tool to execute terminal commands.
 */
const runCommandTool = new DynamicStructuredTool({
  name: "run_command",
  description:
    "Executes a bash/shell command on the user's local machine. Use this to create folders (mkdir), move files (mv), install packages, compile code, or run any arbitrary terminal commands.",
  schema: z.object({
    command: z.string().describe("The shell command to execute.")
  }),
  func: async ({ command }) => {
    try {
      // Request permission before running command
      const approved = await permissionBus.requestPermission("run_command", { command });
      if (!approved) {
        return `Error: User denied permission to run command "${command}".`;
      }

      const { stdout, stderr } = await execPromise(command, {
        cwd: process.cwd(),
      });
      
      let output = "";
      if (stdout) output += `STDOUT:\n${stdout}\n`;
      if (stderr) output += `STDERR:\n${stderr}\n`;
      
      if (!output) {
        return `Command '${command}' executed successfully with no output.`;
      }
      return output.trim();
    } catch (err) {
      return `Error executing command '${command}':\n${err.message}\n\nSTDOUT: ${err.stdout || ""}\nSTDERR: ${err.stderr || ""}`;
    }
  },
});

module.exports = {
  runCommandTool,
};
