const { DynamicStructuredTool } = require("@langchain/core/tools");
const { z } = require("zod");
const fs = require("fs/promises");
const path = require("path");

/**
 * Tool to read the contents of a local file in the workspace.
 * Resolves the path relative to the process directory and enforces boundaries.
 */
const readFileTool = new DynamicStructuredTool({
  name: "read_file",
  description: "Use this tool to read the text contents of a local file in the workspace directory. You must supply a valid relative file path..",
  schema: z.object({
    filePath: z.string().describe("The relative path of the file to read from the project root.")
  }),
  func: async ({ filePath }) => {
    try {
      if (!filePath) {
        return "Error: No file path provided.";
      }

      // Resolve the absolute path
      const absolutePath = path.resolve(process.cwd(), filePath);

      // Security boundary check: Ensure the path is within the workspace
      if (!absolutePath.startsWith(process.cwd())) {
        return "Error: Access denied. You can only read files inside the project workspace directory.";
      }

      // Read file contents
      const content = await fs.readFile(absolutePath, "utf-8");
      return content;
    } catch (err) {
      if (err.code === "ENOENT") {
        return `Error: File not found at path "${filePath}". Please verify the file path.`;
      }
      return `Error reading file: ${err.message}`;
    }
  }
});

/**
 * Tool to list the contents of a directory in the workspace.
 * Automatically filters out node_modules and .git.
 */
const listDirTool = new DynamicStructuredTool({
  name: "list_directory",
  description: "Use this tool to list files and folders inside a given directory in the project workspace directory. Ignores system files and node_modules.",
  schema: z.object({
    dirPath: z.string().optional().describe("The relative path of the directory to list (e.g. 'src', 'src/ui'). ALWAYS relative to project root. To 'go back' or list root, use '.'.")
  }),
  func: async ({ dirPath = "." }) => {
    try {
      const resolvedPath = path.resolve(process.cwd(), dirPath);

      // Security boundary check: Ensure the path is within the workspace
      if (!resolvedPath.startsWith(process.cwd())) {
        return "Error: Access denied. You can only list directories inside the project workspace directory.";
      }

      const entries = await fs.readdir(resolvedPath, { withFileTypes: true });
      if (entries.length === 0) {
        return `Directory "${dirPath}" is empty.`;
      }

      const list = entries
        .filter(entry => entry.name !== "node_modules" && entry.name !== ".git")
        .map(entry => {
          const type = entry.isDirectory() ? "[DIR]" : "[FILE]";
          return `${type} ${entry.name}`;
        })
        .join("\n");

      return list || "No files or folders found (ignored node_modules/.git directories).";
    } catch (err) {
      if (err.code === "ENOENT") {
        return `Error: Directory not found at path "${dirPath}". Please check the path.`;
      }
      return `Error listing directory: ${err.message}`;
    }
  }
});


const { exec } = require("child_process");
const util = require("util");
const execPromise = util.promisify(exec);

/**
 * Tool to search for files by name or content in the workspace.
 */
const searchFilesTool = new DynamicStructuredTool({
  name: "search_files",
  description: "Use this tool to search for files by name or search for text content inside files across the project. Use this when the user asks to find where something is defined or where a file is.",
  schema: z.object({
    query: z.string().describe("The text or file name to search for."),
    searchType: z.enum(["name", "content"]).describe("Whether to search by file 'name' or file 'content'.")
  }),
  func: async ({ query, searchType }) => {
    try {
      let command = "";
      // Exclude node_modules and .git
      if (searchType === "name") {
        command = `find . -not -path "*/node_modules/*" -not -path "*/.git/*" -type f -iname "*${query}*" | head -n 20`;
      } else {
        command = `grep -riI "${query}" . --exclude-dir=node_modules --exclude-dir=.git | head -n 20`;
      }
      
      const { stdout, stderr } = await execPromise(command, { cwd: process.cwd() });
      if (stdout.trim().length === 0) {
        return `No results found for "${query}".`;
      }
      return stdout.trim();
    } catch (err) {
      if (err.code === 1) { // grep returns 1 if no matches
         return `No results found for "${query}".`;
      }
      return `Error executing search: ${err.message}`;
    }
  }
});

module.exports = {
  readFileTool,
  listDirTool,
  searchFilesTool
};
