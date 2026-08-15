const { DynamicStructuredTool } = require("@langchain/core/tools");
const { z } = require("zod");
const { performWebSearch } = require("../utils/search_engine");

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
      const results = await performWebSearch(query, { deepScrape: true });
      if (!results || results.length === 0) {
        return "No web results found.";
      }
      return results.map(r => {
        let text = `Title: ${r.title}\nURL: ${r.url}\nSnippet: ${r.snippet}`;
        if (r.deepContent) {
          text += `\nDeep Content:\n${r.deepContent}`;
        }
        return text;
      }).join("\n\n---\n\n");
    } catch (err) {
      // Return error to bubble up to agent/UI
      return JSON.stringify({ error: `Search failed: ${err.message}` });
    }
  }
});

module.exports = {
  searchTool
};
