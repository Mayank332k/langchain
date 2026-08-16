const { DynamicStructuredTool } = require("@langchain/core/tools");
const { z } = require("zod");
const { performWebSearch } = require("../utils/search_engine");
const { performTavilySearch } = require("../utils/tavily_engine");
const { emitProgress } = require("../utils/tool_progress");
const config = require("../config/settings");

/**
 * LangChain Web Search Tool wrapper.
 * Connects the agent to the custom search engine utility.
 */
const searchTool = new DynamicStructuredTool({
  name: "web_search",
  description: "Use this tool to search the internet for current events, latest news, real-time info. VERY IMPORTANT: You must write extremely precise, keyword-heavy search queries (e.g., 'React 19 release date features' instead of 'What are the new features in React?'). Do not use conversational filler in your queries.",
  schema: z.object({
    query: z.string().describe("The search query string to look up on the web.")
  }),
  func: async ({ query }) => {
    try {
      if (config.enableWebSearch === false) {
        return "Error: Web search is disabled in settings. Tell the user you cannot search the web.";
      }

      if (config.advWebSearch) {
        const tResults = await performTavilySearch(query, { onProgress: emitProgress });
        if (!tResults || tResults.length === 0) {
          return "No web results found via Tavily.";
        }
        return [
          "Web search context (Advanced).",
          ...tResults.slice(0, 5).map((r, index) => {
            return `[${index + 1}] ${r.title}\nURL: ${r.url}\nContent: ${r.content.slice(0, 1500)}`;
          })
        ].join("\n\n---\n\n");
      }

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
