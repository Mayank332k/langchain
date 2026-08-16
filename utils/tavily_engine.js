const { tavily } = require("@tavily/core");

/**
 * Perform Web Search using the advanced Tavily API.
 */
async function performTavilySearch(query, options = {}) {
  const { onProgress } = options;
  
  onProgress?.({ 
    phase: 'searching', 
    message: `Advanced searching Tavily for "${query}"...` 
  });

  const apiKey = process.env.TAVILY || "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";
  const client = tavily({ apiKey });

  try {
    const tResponse = await client.search(query, { searchDepth: "advanced" });
    
    onProgress?.({ 
      phase: 'results', 
      message: `Found ${tResponse.results?.length || 0} advanced results.` 
    });
    
    return tResponse.results || [];
  } catch (error) {
    onProgress?.({ 
      phase: 'error', 
      message: `Tavily search failed: ${error.message}` 
    });
    throw error;
  }
}

module.exports = {
  performTavilySearch
};
