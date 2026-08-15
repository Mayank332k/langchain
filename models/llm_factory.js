const { ChatOpenAI } = require("@langchain/openai");
const config = require("../config/settings");

// Ye factory file model ko initialize karne ka kaam karti hai.

function createLLM() {
  try {
    const modelKwargs = {
      max_completion_tokens: 16384
    };

    const llm = new ChatOpenAI({
      apiKey: config.nvidiaApiKey,
      modelName: config.modelName,
      configuration: {
        baseURL: config.nvidiaBaseUrl
      },
      temperature: 0.7,
      modelKwargs
    });
    return llm;
  } catch (error) {
    console.error("❌ ERROR: LLM Initialize karne me problem aayi:", error.message);
    process.exit(1);
  }
}

module.exports = {
  createLLM
};
