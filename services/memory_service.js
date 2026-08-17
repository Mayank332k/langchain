const fs = require('fs/promises');
const path = require('path');
const { createLLM } = require('../models/llm_factory');
const { HumanMessage } = require("@langchain/core/messages");

const MEMORY_FILE_PATH = path.join(process.cwd(), 'memory.json');
const MAX_CHAR_LIMIT = 15000;

let isSummarizing = false;

/**
 * Loads the rolling memory summary from disk.
 * @returns {Promise<string>} The existing memory string or empty string.
 */
async function loadMemory() {
  try {
    const data = await fs.readFile(MEMORY_FILE_PATH, 'utf-8');
    const parsed = JSON.parse(data);
    return parsed.summary || "";
  } catch (err) {
    return "";
  }
}

/**
 * Saves the updated memory summary to disk.
 * @param {string} summary - The new summary string.
 */
async function saveMemory(summary) {
  try {
    await fs.writeFile(MEMORY_FILE_PATH, JSON.stringify({ summary }, null, 2), 'utf-8');
  } catch (err) {
    console.error("Error saving memory:", err);
  }
}

/**
 * Background task to generate a summary of the conversation history.
 */
async function _backgroundSummarize(historyText) {
  if (isSummarizing) return;
  isSummarizing = true;
  try {
    const existingMemory = await loadMemory();
    const llm = createLLM();
    
    const prompt = `You are a memory manager for an AI assistant named Kea. 
Your task is to summarize the following conversation history and integrate it with the existing long-term memory.
Keep the summary concise but retain all important facts, user preferences, past instructions, and key outcomes.

=== EXISTING MEMORY ===
${existingMemory || "No existing memory."}

=== RECENT CONVERSATION HISTORY ===
${historyText}

Return ONLY the updated comprehensive summary text without any additional commentary.`;

    const response = await llm.invoke([new HumanMessage(prompt)]);
    if (response && response.content) {
      await saveMemory(response.content.trim());
    }
  } catch (err) {
    console.error("Background summarization failed:", err);
  } finally {
    isSummarizing = false;
  }
}

/**
 * Checks the size of the chat history. Triggers a background summarization if it exceeds the limit, 
 * and immediately returns a truncated chat history to keep the UI fast.
 * @param {Array} chatHistory - The current array of LangChain messages.
 * @returns {Array} The updated/truncated chat history.
 */
function manageMemory(chatHistory) {
  let totalLength = 0;
  let historyText = "";
  
  for (const msg of chatHistory) {
    const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
    totalLength += content.length;
    // msg._getType() usually returns 'human', 'ai', 'system' etc.
    const role = msg._getType ? msg._getType() : 'unknown';
    historyText += `Role: ${role}\nContent: ${content}\n\n`;
  }

  if (totalLength > MAX_CHAR_LIMIT && !isSummarizing) {
    // Fire and forget background summarization
    _backgroundSummarize(historyText).catch(e => console.error(e));
    
    // Immediately slice history to keep only the last 4 messages (approx 2 complete turns)
    // to prevent the current context from blowing up while the summary is generated.
    return chatHistory.slice(-4);
  }
  
  return chatHistory;
}

module.exports = {
  loadMemory,
  saveMemory,
  manageMemory
};
