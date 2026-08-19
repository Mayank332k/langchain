const { searchTool } = require('./search');
const { readFileTool, readMultipleFilesTool, listDirTool, searchFilesTool, writeFileTool } = require('./file_ops');
const { instructionManualTool } = require('./meta');
const { runCommandTool } = require('./terminal');
const { askUserQuestionTool } = require('./ask_user');
const { enterPlanModeTool, exitPlanModeTool } = require('./plan');

// Central registry for all active tools in the application.
// Future tools (like terminal execution, file writing) can be imported 
// and added to the allTools array here to automatically register them.
const allTools = [
  searchTool,
  readFileTool,
  readMultipleFilesTool,
  listDirTool,
  searchFilesTool,
  writeFileTool,
  instructionManualTool,
  runCommandTool,
  askUserQuestionTool,
  enterPlanModeTool,
  exitPlanModeTool
];

module.exports = {
  allTools,
  searchTool,
  readFileTool,
  readMultipleFilesTool,
  listDirTool,
  searchFilesTool,
  writeFileTool,
  instructionManualTool,
  runCommandTool,
  askUserQuestionTool,
  enterPlanModeTool,
  exitPlanModeTool
};
