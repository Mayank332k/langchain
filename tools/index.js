const { searchTool } = require('./search');
const { readFileTool, listDirTool, searchFilesTool } = require('./file_ops');

// Central registry for all active tools in the application.
// Future tools (like terminal execution, file writing) can be imported 
// and added to the allTools array here to automatically register them.
const allTools = [
  searchTool,
  readFileTool,
  listDirTool,
  searchFilesTool
];

module.exports = {
  allTools,
  searchTool,
  readFileTool,
  listDirTool,
  searchFilesTool
};
