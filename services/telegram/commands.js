const { getSettingsMenu, getModelMenu } = require('./actions');
const { getAgentSettings } = require('../agent_service');

function registerCommands(bot, activeRequests) {
  bot.start((ctx) => {
    ctx.reply('Hello! I am Kea, your coding buddy. Send me a message to start.');
  });

  bot.command('stop', (ctx) => {
    const chatId = ctx.chat.id;
    const session = activeRequests.get(chatId);

    if (session && session.active) {
      session.abortController.abort();
      // Session cleanup happens in message_handler's catch block
      ctx.reply('[STOPPED] Generation cancelled.');
    } else {
      ctx.reply('Nothing running right now.');
    }
  });

  bot.command('settings', (ctx) => {
    ctx.reply('*Kea Settings*\nToggle options below:', {
      parse_mode: 'Markdown',
      ...getSettingsMenu()
    });
  });

  bot.command('model', (ctx) => {
    const current = getAgentSettings().model;
    const shortName = current.split('/').pop();
    ctx.reply(`*Model Selection*\nCurrent: ${shortName}\n\nChoose a model:`, {
      parse_mode: 'Markdown',
      ...getModelMenu()
    });
  });
}

module.exports = registerCommands;
