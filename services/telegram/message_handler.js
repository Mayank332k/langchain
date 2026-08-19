const { processUserQueryStream, getAgentSettings } = require('../agent_service');

/**
 * Per-chat session object to track all active state.
 * This is the single source of truth for a running request.
 */
function createSession(chatId) {
  return {
    chatId,
    abortController: new AbortController(),
    typingInterval: null,
    uiInterval: null,
    statusMessageId: null,
    lastSentText: '',
    // Live streaming state
    currentStatus: 'Thinking...',
    currentReasoning: '',
    currentAnswer: '',
    phase: 'thinking', // 'thinking' | 'answering'
    active: true
  };
}

/**
 * Cleanly tear down all intervals and state for a session.
 */
function destroySession(session, activeRequests) {
  session.active = false;
  if (session.typingInterval) clearInterval(session.typingInterval);
  if (session.uiInterval) clearInterval(session.uiInterval);
  activeRequests.delete(session.chatId);
}

/**
 * Safely edit a Telegram message. Swallows all errors.
 */
async function safeEditMessage(ctx, messageId, text, parseMode) {
  try {
    const opts = parseMode ? { parse_mode: parseMode } : {};
    await ctx.telegram.editMessageText(ctx.chat.id, messageId, undefined, text, opts);
    return true;
  } catch {
    return false;
  }
}

/**
 * Convert standard Markdown to Telegram-safe HTML.
 * HTML mode is much more stable for live streaming than Markdown V2.
 */
function toTelegramHTML(text) {
  if (!text) return '';
  return text
    // 1. Escape HTML special characters
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // 2. Bold (**text**)
    .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
    // 3. Code blocks (```language\n code \n```)
    .replace(/```[a-z0-9]*\n([\s\S]*?)```/gi, '<pre>$1</pre>')
    // 4. Inline code (`code`)
    .replace(/`(.*?)`/g, '<code>$1</code>')
    // 5. Headings (# Heading)
    .replace(/^#+\s+(.*)$/gm, '<b>$1</b>')
    // 6. Links ([text](url))
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
    // 7. Italic (*text* or _text_) - optional, but good for completeness
    .replace(/\*(.*?)\*/g, '<i>$1</i>')
    .replace(/_(.*?)_/g, '<i>$1</i>');
}

/**
 * Strip all markdown for plain text fallback.
 */
function toPlainText(text) {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .replace(/```[a-z0-9]*\n([\s\S]*?)```/gi, '$1')
    .replace(/\[(.*?)\]\((.*?)\)/g, '$1 ($2)')
    .replace(/^#+\s+/gm, '');
}

/**
 * Build the live UI text based on current session state.
 * Shows ONE status at a time like a terminal spinner — no log accumulation.
 */
function buildLiveText(session) {
  // Phase 1: Still thinking / running tools — show single status line
  if (session.phase === 'thinking') {
    let text = session.currentStatus || 'Processing...';

    if (session.currentReasoning && getAgentSettings().showThinking) {
      let reasoning = session.currentReasoning;
      if (reasoning.length > 800) reasoning = '...' + reasoning.slice(-800);
      // Escape HTML for reasoning
      reasoning = reasoning.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      text += `\n\n<i>Thinking...</i>\n<pre>${reasoning}</pre>`;
    }
    return { text, parseMode: 'HTML' };
  }

  // Phase 2: Answer is streaming in — show answer only
  if (session.phase === 'answering' && session.currentAnswer) {
    const formatted = toTelegramHTML(session.currentAnswer);
    return { text: formatted, parseMode: 'HTML' };
  }

  return { text: session.currentStatus || 'Processing...', parseMode: null };
}

/**
 * Start the "typing..." chat action loop.
 */
function startTypingLoop(ctx, session) {
  ctx.sendChatAction('typing').catch(() => {});
  session.typingInterval = setInterval(() => {
    if (!session.active) return;
    ctx.sendChatAction('typing').catch(() => {});
  }, 5000);
}

/**
 * Immediately push current UI state to Telegram (don't wait for interval).
 * Debounced internally — won't fire more than once per 800ms.
 */
let lastFlushTime = 0;
async function flushUi(ctx, session) {
  if (!session.active || !session.statusMessageId) return;
  const now = Date.now();
  if (now - lastFlushTime < 800) return; // debounce
  lastFlushTime = now;

  const { text, parseMode } = buildLiveText(session);
  if (text && text !== session.lastSentText) {
    session.lastSentText = text;
    const sent = await safeEditMessage(ctx, session.statusMessageId, text, parseMode);
    if (!sent && parseMode) {
      const plain = toPlainText(text);
      await safeEditMessage(ctx, session.statusMessageId, plain, null);
    }
  }
}

/**
 * Start the UI updater that edits the status message periodically.
 * This single loop handles both thinking status AND answer streaming.
 */
function startUiLoop(ctx, session) {
  session.uiInterval = setInterval(async () => {
    if (!session.active || !session.statusMessageId) return;

    const { text, parseMode } = buildLiveText(session);

    if (text && text !== session.lastSentText) {
      session.lastSentText = text;
      const sent = await safeEditMessage(ctx, session.statusMessageId, text, parseMode);
      if (!sent && parseMode) {
        const plain = toPlainText(text);
        await safeEditMessage(ctx, session.statusMessageId, plain, null);
      }
    }
  }, 1000);
}

function registerMessageHandler(bot, activeRequests) {
  bot.on('text', (ctx) => {
    handleTextMessage(ctx, activeRequests).catch(err => {
      console.error('[message_handler] Unhandled error:', err.message || err);
    });
  });
}

async function handleTextMessage(ctx, activeRequests) {
  const chatId = ctx.chat.id;
  const userText = ctx.message.text;

  // 1. Cancel any existing session for this chat
  const existing = activeRequests.get(chatId);
  if (existing) {
    existing.abortController.abort();
    destroySession(existing, activeRequests);
  }

  // 2. Create a fresh session
  const session = createSession(chatId);
  activeRequests.set(chatId, session);

  // 3. Send placeholder
  try {
    const msg = await ctx.reply('Kea is thinking...');
    session.statusMessageId = msg.message_id;
    session.lastSentText = 'Kea is thinking...';
  } catch (e) {
    console.error('[message_handler] Failed to send placeholder:', e.message);
    destroySession(session, activeRequests);
    return;
  }

  // 4. Start background loops
  startTypingLoop(ctx, session);
  startUiLoop(ctx, session);

  // 5. Stream events listener — updates session state in real-time
  const onEvent = (event) => {
    if (!session.active) return;

    if (event.type === 'status' && event.message) {
      session.currentStatus = event.message;
      // If a tool/status event arrives mid-answer, switch back to thinking
      // so the user sees the tool activity instead of a frozen partial answer
      session.phase = 'thinking';
      flushUi(ctx, session).catch(() => {});
    } else if (event.type === 'status' && !event.message) {
      // agent_service sends empty status on clearStatusCycle — ignore on Telegram
    } else if (event.type === 'reasoning') {
      session.currentReasoning += event.token;
    } else if (event.type === 'token') {
      if (session.phase !== 'answering') {
        session.phase = 'answering';
        flushUi(ctx, session).catch(() => {});
      }
      session.currentAnswer += event.token;
    } else if (event.type === 'tool_progress' && event.message) {
      session.currentStatus = event.message;
      session.phase = 'thinking';
      flushUi(ctx, session).catch(() => {});
    }
  };

  // 6. Run the agent
  try {
    const answer = await processUserQueryStream(userText, onEvent, session.abortController.signal);
    destroySession(session, activeRequests);

    if (!answer) return;

    // Final edit with the complete answer
    const formatted = toTelegramHTML(answer);
    const sent = await safeEditMessage(ctx, session.statusMessageId, formatted, 'HTML');
    if (!sent) {
      // Fallback
      await safeEditMessage(ctx, session.statusMessageId, toPlainText(answer), null);
    }
  } catch (error) {
    destroySession(session, activeRequests);

    const isAbort = error.name === 'AbortError' || (error.message && error.message.includes('aborted'));
    if (!isAbort) {
      await ctx.reply('[ERROR] ' + (error.message || String(error))).catch(() => {});
    }
  }
}

module.exports = registerMessageHandler;
