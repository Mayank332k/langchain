const { createReactAgent } = require("@langchain/langgraph/prebuilt");
const { createLLM } = require("../models/llm_factory");
const { getSystemPrompt } = require("../prompts/system");
const { HumanMessage, AIMessage } = require("@langchain/core/messages");
const config = require("../config/settings");
const { allTools } = require("../tools");
const { subscribeProgress } = require("../utils/tool_progress");
const memoryService = require("./memory_service");

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
    showThinking: config.showThinking,
    enableWebSearch: config.enableWebSearch,
    advWebSearch: config.advWebSearch
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
  if (newSettings.enableWebSearch !== undefined) {
    config.enableWebSearch = newSettings.enableWebSearch;
  }
  if (newSettings.advWebSearch !== undefined) {
    config.advWebSearch = newSettings.advWebSearch;
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
    tools
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
    clearStatusCycle();
    onEvent({
      type: "tool_progress",
      phase: progress.phase,
      message: progress.message
    });
  });

  try {
    const inputMessage = new HumanMessage(input);
    const recentHistory = chatHistory; // Now fully managed by memoryService
    
    const memoryContext = await memoryService.loadMemory();
    const systemMessage = getSystemPrompt(memoryContext);
    
    const messages = [systemMessage, ...recentHistory, inputMessage];
    
    // LangGraph streamEvents API v2 se real-time events stream karte hain
    const eventStream = agent.streamEvents(
      { messages: messages },
      { version: "v2", recursionLimit: 100, signal: signal }
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
      // AI ne tool invoke kiya
      else if (event.event === "on_tool_start") {
        const toolName = event.name;
        const inputArgs = event.data?.input || {};
        clearStatusCycle(onEvent);
        onEvent({ type: "tool_call", name: toolName, args: inputArgs });
      }
      // Tool execution complete
      else if (event.event === "on_tool_end") {
        const toolName = event.name;
        let output = event.data?.output;
        if (output && typeof output === 'object') {
          output = output.content || JSON.stringify(output);
        }
        clearStatusCycle(onEvent);
        onEvent({ type: "tool_result", name: toolName, output });
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
            if (!answerStarted) {
              const trimmed = content.trimStart();
              if (trimmed.length > 0) {
                clearStatusCycle(onEvent);
                answerStarted = true;
                fullAnswer += trimmed;
                onEvent({ type: "token", token: trimmed });
              }
            } else {
              fullAnswer += content;
              onEvent({ type: "token", token: content });
            }
          }

          // If the model is streaming a tool call, show a status so the UI doesn't look frozen
          if (chunk.tool_call_chunks && chunk.tool_call_chunks.length > 0) {
            const tc = chunk.tool_call_chunks[0];
            if (tc.name) {
              onEvent({ type: "status", message: `Preparing to run ${tc.name}...` });
            } else if (!activeStatusInterval && !answerStarted) {
              onEvent({ type: "status", message: `Preparing tool arguments...` });
            }
          }
        }
      }
    }
    
    clearStatusCycle(onEvent);

    // History update karte hain
    chatHistory.push(inputMessage);
    memoryService.logChatMessage('user', input);

    if (fullAnswer) {
      chatHistory.push(new AIMessage(fullAnswer));
      memoryService.logChatMessage('assistant', fullAnswer);
    }
    
    // Check and trigger rolling memory if limit exceeded
    chatHistory = memoryService.manageMemory(chatHistory);
    
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

function clearAgentHistory() {
  chatHistory = [];
}

module.exports = {
  processUserQueryStream,
  getAgentSettings,
  updateAgentSettings,
  clearAgentHistory
};
