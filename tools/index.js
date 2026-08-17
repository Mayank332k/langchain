const { searchTool } = require('./search');
const { readFileTool, readMultipleFilesTool, listDirTool, searchFilesTool } = require('./file_ops');
const { instructionManualTool } = require('./meta');

// Central registry for all active tools in the application.
// Future tools (like terminal execution, file writing) can be imported 
// and added to the allTools array here to automatically register them.
const allTools = [
  searchTool,
  readFileTool,
  readMultipleFilesTool,
  listDirTool,
  searchFilesTool,
  instructionManualTool
];

module.exports = {
  allTools,
  searchTool,
  readFileTool,
  readMultipleFilesTool,
  listDirTool,
  searchFilesTool,
  instructionManualTool
};
