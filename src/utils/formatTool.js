/**
 * Formats a tool call into a compact human-readable string.
 * @param {string} toolName 
 * @param {object} args 
 * @param {boolean} isCompleted
 * @returns {{ action: string, detail: string }}
 */
function formatToolCall(toolName, args, isCompleted = false) {
  let action = isCompleted ? "Ran tool" : "Running tool";
  let detail = toolName;

  switch (toolName) {
    case 'run_command':
      action = isCompleted ? "Ran command" : "Running command";
      detail = args.command || "";
      break;
    case 'web_search':
      action = isCompleted ? "Searched the web" : "Searching the web";
      detail = args.query || "";
      break;
    case 'search_files':
      action = isCompleted ? "Searched codebase" : "Searching codebase";
      detail = args.query || "";
      break;
    case 'write_file':
      action = isCompleted ? "Wrote file" : "Writing file";
      detail = args.filePath || "";
      break;
    case 'read_file':
      action = isCompleted ? "Read file" : "Reading file";
      detail = args.filePath || "";
      break;
    case 'read_multiple_files':
      action = isCompleted ? "Read files" : "Reading files";
      detail = `${args.filePaths ? args.filePaths.length : 0} files`;
      break;
    case 'list_directory':
      action = isCompleted ? "Listed directory" : "Listing directory";
      detail = args.dirPath || ".";
      break;
    case 'ask_user':
      action = isCompleted ? "Asked user" : "Asking user";
      detail = args.questions ? args.questions.map(q => q.question).join(", ") : "";
      break;
    default:
      action = isCompleted ? "Ran tool" : "Running tool";
      detail = toolName;
      break;
  }

  // Truncate detail if it's too long
  if (detail.length > 50) {
    detail = detail.substring(0, 47) + "...";
  }

  return { action, detail };
}

module.exports = { formatToolCall };
