const { createReactAgent } = require("@langchain/langgraph/prebuilt");
const { createLLM } = require("../models/llm_factory");
const { getSystemPrompt } = require("../prompts/system");
const { HumanMessage, AIMessage } = require("@langchain/core/messages");
const config = require("../config/settings");
const { allTools } = require("../tools");
const { subscribeProgress } = require("../utils/tool_progress");

// Ye service file agent ka logic aur animated status updates handle karti hai.

let agent = null;
let chatHistory = []; 
let activeStatusInterval = null;

function clearStatusCycle(onEvent) {
  if (activeStatusInterval) {
    clearInterval(activeStatusInterval);
    activeStatusInterval = null;
  }
  if (onEvent) {
    onEvent({ type: "status", message: "" });
  }
}

function startStatusCycle(onEvent, statusMessages, intervalMs = 1500) {
  clearStatusCycle();
  let stepIndex = 0;
  
  // Set first status immediately
  onEvent({ type: "status", message: statusMessages[stepIndex] });
  
  activeStatusInterval = setInterval(() => {
    stepIndex++;
    if (stepIndex < statusMessages.length) {
      onEvent({ type: "status", message: statusMessages[stepIndex] });
    } else {
      // Stay on the last message or clear the timer
      clearInterval(activeStatusInterval);
    }
  }, intervalMs);
}

function getAgentSettings() {
  return {
    model: config.modelName,
    thinking: config.enableThinking,
    showThinking: config.showThinking
  };
}

function updateAgentSettings(newSettings) {
  if (newSettings.model) {
    config.modelName = newSettings.model;
  }
  if (newSettings.thinking !== undefined) {
    config.enableThinking = newSettings.thinking;
  }
  if (newSettings.showThinking !== undefined) {
    config.showThinking = newSettings.showThinking;
  }
  
  // Persist settings to disk
  config.saveSettings();

  // Clear the cached agent so next run re-initializes it with the new configuration
  agent = null;
}

function initAgent() {
  const llm = createLLM();
  const tools = allTools;
  
  // Agent banate hain jo tools call kar sakta hai
  agent = createReactAgent({
    llm,
    tools,
    messageModifier: getSystemPrompt()
  });
}

/**
 * User ki query ko agent se stream karwana.
 * @param {string} input - User input string
 * @param {function} onEvent - Status / Token callback for Ora spinner
 */
async function processUserQueryStream(input, onEvent, signal) {
  if (!agent) {
    initAgent();
  }

  const unsubscribeProgress = subscribeProgress((progress) => {
    onEvent({
      type: "tool_progress",
      phase: progress.phase,
      message: progress.message
    });
  });

  try {
    const inputMessage = new HumanMessage(input);
    // Only send the last 6 messages (3 turns) to save tokens/context length
    const recentHistory = chatHistory.slice(-6);
    const messages = [...recentHistory, inputMessage];
    
    // LangGraph streamEvents API v2 se real-time events stream karte hain
    const eventStream = agent.streamEvents(
      { messages: messages },
      { version: "v2", recursionLimit: 30 }
    );

    let fullAnswer = "";
    let answerStarted = false;

    for await (const event of eventStream) {
      // Check if user pressed ESC
      if (signal && signal.aborted) {
        clearStatusCycle(onEvent);
        break;
      }
      // LLM ne sochna shuru kiya
      if (event.event === "on_chat_model_start") {
        startStatusCycle(onEvent, [
          "Thinking...",
          "Looking carefully...",
          "Analyzing context...",
          "Connecting the dots...",
          "Formulating thoughts..."
        ], 2000);
      }
      // AI ne Web Search tool invoke kiya
      else if (event.event === "on_tool_start") {
        const toolName = event.name;
        const inputArgs = event.data?.input || {};

        if (toolName === "web_search") {
          onEvent({ type: "status", message: `Searching web for "${inputArgs.query || "web"}"...` });
        } else if (toolName === "read_file") {
          const fp = inputArgs.filePath || "file";
          startStatusCycle(onEvent, [
            `Reading ${fp}...`,
            "Checking boundaries...",
            "Parsing file contents..."
          ], 1000);
        } else if (toolName === "list_directory") {
          const dp = inputArgs.dirPath || "root directory";
          startStatusCycle(onEvent, [
            `Listing ${dp}...`,
            "Scanning file structures...",
            "Filtering system folders..."
          ], 1000);
        } else if (toolName === "search_files") {
          const q = inputArgs.query || "files";
          startStatusCycle(onEvent, [
            `Searching codebase for "${q}"...`,
            "Scanning file system...",
            "Filtering matching text..."
          ], 1000);
        } else {
          startStatusCycle(onEvent, [
            `Running ${toolName}...`,
            `Processing parameters...`,
            `Executing nodes...`
          ], 1500);
        }
      }
      // Web search poora ho gaya
      else if (event.event === "on_tool_end") {
        const toolName = event.name;
        if (toolName === "read_file") {
          startStatusCycle(onEvent, [
            "File read completed...",
            "Synthesizing file insights..."
          ], 1000);
        } else if (toolName === "list_directory") {
          startStatusCycle(onEvent, [
            "Directory list retrieved...",
            "Formatting files layout..."
          ], 1000);
        } else if (toolName === "search_files") {
          startStatusCycle(onEvent, [
            "Search completed...",
            "Analyzing match results..."
          ], 1000);
        } else {
          startStatusCycle(onEvent, [
            "Got tool data, reading...",
            "Digesting details...",
            "Synthesizing structured response..."
          ], 1500);
        }
      }
      // Token-by-token final answer streaming
      else if (event.event === "on_chat_model_stream") {
        if (event.data && event.data.chunk) {
          const chunk = event.data.chunk;
          const reasoning = chunk.additional_kwargs?.reasoning_content || chunk.response_metadata?.delta?.reasoning_content;
          
          if (reasoning && typeof reasoning === "string" && reasoning.length > 0) {
            onEvent({ type: "reasoning", token: reasoning });
          }

          const content = chunk.content;
          if (typeof content === "string" && content.length > 0) {
            // Keep the thinking animation during reasoning; stop it only when answer text starts.
            if (!answerStarted) {
              clearStatusCycle(onEvent);
              answerStarted = true;
            }
            fullAnswer += content;
            onEvent({ type: "token", token: content });
          }
        }
      }
    }
    
    clearStatusCycle(onEvent);

    // History update karte hain
    chatHistory.push(inputMessage);
    if (fullAnswer) {
      chatHistory.push(new AIMessage(fullAnswer));
    }
    
    return fullAnswer;
  } catch (error) {
    clearStatusCycle(onEvent);
    if (onEvent) {
      onEvent({ type: "error", message: error.message || String(error) });
    }
    throw error;
  } finally {
    unsubscribeProgress();
  }
}

module.exports = {
  processUserQueryStream,
  getAgentSettings,
  updateAgentSettings
};
