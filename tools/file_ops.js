const { DynamicStructuredTool } = require("@langchain/core/tools");
const { z } = require("zod");
const fs = require("fs/promises");
const path = require("path");

/**
 * Tool to read the contents of a local file in the workspace.
 */
const readFileTool = new DynamicStructuredTool({
  name: "read_file",
  description:
    "Use this tool to read the text contents of a local file anywhere on the system. You can supply an absolute path or a relative path.",
  schema: z.object({
    filePath: z
      .string()
      .describe("The absolute or relative path of the file to read."),
  }),
  func: async ({ filePath }) => {
    try {
      if (!filePath) {
        return "Error: No file path provided.";
      }

      const absolutePath = path.resolve(process.cwd(), filePath);


      const content = await fs.readFile(absolutePath, "utf-8");


      return content;
    } catch (err) {
      if (err.code === "ENOENT") {
        return `Error: File not found at path "${filePath}". Please verify the file path.`;
      }
      return `Error reading file: ${err.message}`;
    }
  },
});

/**
 * Tool to read multiple files at once. Useful for understanding a codebase.
 */
const readMultipleFilesTool = new DynamicStructuredTool({
  name: "read_multiple_files",
  description:
    "Use this tool to read multiple files at once. You can supply absolute or relative paths anywhere on the system. Max 8 files per call.",
  schema: z.object({
    filePaths: z
      .array(z.string())
      .describe("Array of file paths to read (max 8)."),
  }),
  func: async ({ filePaths }) => {
    if (!filePaths || filePaths.length === 0) {
      return "Error: No file paths provided.";
    }

    const paths = filePaths.slice(0, 8);
    const results = [];

    for (let i = 0; i < paths.length; i++) {
      const filePath = paths[i];
      const absolutePath = path.resolve(process.cwd(), filePath);


      try {
        const content = await fs.readFile(absolutePath, "utf-8");
        results.push(
          `================ FILE: ${filePath} ================\n${content}`,
        );
      } catch (err) {
        results.push(
          `================ FILE: ${filePath} ================\nError: ${err.code === "ENOENT" ? "File not found" : err.message}`,
        );
      }
    }


    return results.join("\n\n");
  },
});

/**
 * Tool to list the contents of a directory in the workspace.
 * Automatically filters out node_modules and .git.
 */
const listDirTool = new DynamicStructuredTool({
  name: "list_directory",
  description:
    "Use this tool to list files and folders inside a given directory anywhere on the system. Ignores system files and node_modules.",
  schema: z.object({
    dirPath: z
      .string()
      .optional()
      .describe(
        "The absolute or relative path of the directory to list. Defaults to '.'.",
      ),
  }),
  func: async ({ dirPath = "." }) => {
    try {
      const resolvedPath = path.resolve(process.cwd(), dirPath);

      const entries = await fs.readdir(resolvedPath, { withFileTypes: true });
      if (entries.length === 0) {
        return `Directory "${dirPath}" is empty.`;
      }

      const list = entries
        .filter(
          (entry) => entry.name !== "node_modules" && entry.name !== ".git",
        )
        .map((entry) => {
          const type = entry.isDirectory() ? "[DIR]" : "[FILE]";
          return `${type} ${entry.name}`;
        })
        .join("\n");

      return (
        list ||
        "No files or folders found (ignored node_modules/.git directories)."
      );
    } catch (err) {
      if (err.code === "ENOENT") {
        return `Error: Directory not found at path "${dirPath}". Please check the path.`;
      }
      return `Error listing directory: ${err.message}`;
    }
  },
});

const { exec } = require("child_process");
const util = require("util");
const execPromise = util.promisify(exec);

/**
 * Tool to search for files by name or content in the workspace.
 */
const searchFilesTool = new DynamicStructuredTool({
  name: "search_files",
  description:
    "Use this tool to search for files by name or search for text content inside files across the project. Use this when the user asks to find where something is defined or where a file is.",
  schema: z.object({
    query: z.string().describe("The text or file name to search for."),
    searchType: z
      .enum(["name", "content"])
      .describe("Whether to search by file 'name' or file 'content'."),
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

      const { stdout, stderr } = await execPromise(command, {
        cwd: process.cwd(),
      });
      if (stdout.trim().length === 0) {
        return `No results found for "${query}".`;
      }
      return stdout.trim();
    } catch (err) {
      if (err.code === 1) {
        // grep returns 1 if no matches
        return `No results found for "${query}".`;
      }
      return `Error executing search: ${err.message}`;
    }
  },
});

module.exports = {
  readFileTool,
  readMultipleFilesTool,
  listDirTool,
  searchFilesTool,
};
