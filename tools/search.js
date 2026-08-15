const { DynamicStructuredTool } = require("@langchain/core/tools");
const { z } = require("zod");
const { performWebSearch } = require("../utils/search_engine");
const { emitProgress } = require("../utils/tool_progress");

/**
 * LangChain Web Search Tool wrapper.
 * Connects the agent to the custom search engine utility.
 */
const searchTool = new DynamicStructuredTool({
  name: "web_search",
  description: "Use this tool to search the internet for current events, latest news, real-time info, or dates.",
  schema: z.object({
    query: z.string().describe("The search query string to look up on the web.")
  }),
  func: async ({ query }) => {
    try {
      const results = await performWebSearch(query, {
        deepScrape: true,
        onProgress: emitProgress
      });
      if (!results || results.length === 0) {
        return "No web results found.";
      }
      const relevantResults = results.slice(0, 5);
      return [
        "Web search context. Use this information to answer the user's question; do not dump this entire list unless the user asks for sources.",
        ...relevantResults.map((r, index) => {
          let text = `[${index + 1}] ${r.title}\nURL: ${r.url}\nSnippet: ${r.snippet}`;
          if (r.deepContent) {
            text += `\nRelevant content: ${r.deepContent.slice(0, 1200)}`;
          }
          return text;
        })
      ].join("\n\n---\n\n");
    } catch (err) {
      // Return error to bubble up to agent/UI
      return JSON.stringify({ error: `Search failed: ${err.message}` });
    }
  }
});

module.exports = {
  searchTool
};
