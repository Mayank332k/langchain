const { Telegraf } = require('telegraf');
const config = require('../../config/settings');
const registerCommands = require('./commands');
const { registerActions } = require('./actions');
const registerMessageHandler = require('./message_handler');

if (!config.telegramBotToken) {
  console.error('[ERROR] TELEGRAM_BOT_TOKEN is missing in .env');
  process.exit(1);
}

const bot = new Telegraf(config.telegramBotToken, { handlerTimeout: 9_000_000 });

// activeRequests: Map<chatId, session>
// Session objects are created/destroyed in message_handler.js
const activeRequests = new Map();

registerCommands(bot, activeRequests);
registerActions(bot);
registerMessageHandler(bot, activeRequests);

// Global error handler — prevents unhandled rejections from crashing the process
bot.catch((err, ctx) => {
  console.error(`[Telegram Error] ${ctx.updateType}:`, err.description || err.message || err);
  try {
    if (ctx.chat) ctx.reply('Internal error occurred, but bot is still running.');
  } catch (_) {}
});

bot.launch().then(() => {
  console.log('[INFO] Kea Telegram bot is running.');
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
