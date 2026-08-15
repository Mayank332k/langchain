const { ChatOpenAI } = require("@langchain/openai");
const config = require("../config/settings");

// Ye factory file model ko initialize karne ka kaam karti hai.

function createLLM() {
  try {
    const modelKwargs = {
      max_completion_tokens: 16384
    };

    if (config.modelName === "google/gemma-4-31b-it" && config.enableThinking) {
      modelKwargs.chat_template_kwargs = {
        enable_thinking: true
      };
    }

    const llm = new ChatOpenAI({
      apiKey: config.nvidiaApiKey,
      modelName: config.modelName,
      configuration: {
        baseURL: config.nvidiaBaseUrl
      },
      temperature: config.modelName === "google/gemma-4-31b-it" ? 1 : 0.7,
      topP: config.modelName === "google/gemma-4-31b-it" ? 0.95 : undefined,
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
