const fs = require('fs/promises');
const path = require('path');

const KEA_DIR = path.join(process.cwd(), '.kea');
const MEMORY_DIR = path.join(KEA_DIR, 'memory');
const MEMORY_INDEX_PATH = path.join(KEA_DIR, 'MEMORY.md');
const CHAT_LOG_FILE_PATH = path.join(process.cwd(), 'chat_log.json');
const MAX_CHAR_LIMIT = 15000;

/**
 * Ensures the memory directory and index file exist.
 */
async function initMemorySystem() {
  try {
    await fs.mkdir(MEMORY_DIR, { recursive: true });
    try {
      await fs.access(MEMORY_INDEX_PATH);
    } catch {
      await fs.writeFile(MEMORY_INDEX_PATH, "<!-- Kea Memory Index -->\n", "utf-8");
    }
  } catch (err) {
    console.error("Error initializing memory system:", err);
  }
}

// Fire-and-forget init
initMemorySystem().catch(e => console.error(e));

/**
 * Logs a message to the chat log file.
 */
async function logChatMessage(role, content) {
  try {
    let currentLog = [];
    try {
      const data = await fs.readFile(CHAT_LOG_FILE_PATH, 'utf-8');
      if (data) currentLog = JSON.parse(data);
    } catch (err) {
      // File might not exist yet, that's fine
    }

    currentLog.push({
      timestamp: new Date().toISOString(),
      role,
      content
    });

    await fs.writeFile(CHAT_LOG_FILE_PATH, JSON.stringify(currentLog, null, 2), 'utf-8');
  } catch (err) {
    console.error("Error writing to chat log:", err);
  }
}

/**
 * Loads the memory index from disk.
 * @returns {Promise<string>} The existing memory index string or empty string.
 */
async function loadMemory() {
  try {
    const data = await fs.readFile(MEMORY_INDEX_PATH, 'utf-8');
    return data;
  } catch (err) {
    return "";
  }
}

/**
 * Checks the size of the chat history and truncates it to keep the UI fast.
 * The background summarization LLM task has been removed because the agent
 * is now instructed to proactively manage its own memory using the write_file tool.
 * @param {Array} chatHistory - The current array of LangChain messages.
 * @returns {Array} The updated/truncated chat history.
 */
function manageMemory(chatHistory) {
  let totalLength = 0;
  
  for (const msg of chatHistory) {
    const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
    totalLength += content.length;
  }

  if (totalLength > MAX_CHAR_LIMIT) {
    // Immediately slice history to keep only the last 4 messages (approx 2 complete turns)
    // to prevent the current context from blowing up.
    return chatHistory.slice(-4);
  }
  
  return chatHistory;
}

module.exports = {
  loadMemory,
  manageMemory,
  logChatMessage
};
