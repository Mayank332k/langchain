const { DynamicStructuredTool } = require("@langchain/core/tools");
const { z } = require("zod");

const instructionManualTool = new DynamicStructuredTool({
  name: "instruction_manual",
  description:
    "Call this tool if you need to understand the rules and best practices for using your available tools. No need to provide any arguments.",
  schema: z.object({}),
  func: async () => {
    return `TOOL INSTRUCTIONS MANUAL:
1. If the user asks for latest news, weather, or recent facts, use the \`web_search\` tool once with a focused query. Treat its output as research context, answer the user's question directly, and do not dump raw search results or a long list of URLs unless the user explicitly asks for sources.
2. If the user asks you to inspect, read, check, or analyze a local file, use \`read_file\`. If they ask to search, view, check, or list files/folders in the workspace, use \`list_directory\` or \`search_files\` as appropriate.
3. TOOL LOOP PREVENTION: Do not repeat the same tool with the same or nearly identical arguments for one user query.
4. After a tool returns useful results, stop calling tools, analyze the result, and answer the user.
5. Make at most 2 tool calls for one user query. If a tool returns no results or an error, explain that directly instead of retrying indefinitely.
6. Never call a tool just to confirm a result that is already available.
7. For web answers, mention only the most relevant source when useful. Prefer a concise summary over copying titles, snippets, or full links from the tool output.
8. ALWAYS SPEAK BEFORE ACTING: Before calling ANY tool, you MUST first output a short, funny Hinglish sentence explaining to the user what you are about to do and why (e.g. "Ruk bhai, main abhi app.js check karta hu!"). Never call a tool silently without warning the user first.`;
  },
});

module.exports = {
  instructionManualTool,
};
