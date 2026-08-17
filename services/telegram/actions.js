const { Markup } = require('telegraf');
const { getAgentSettings, updateAgentSettings } = require('../agent_service');

// Must match the models in src/ui/components/Settings.jsx
const AVAILABLE_MODELS = [
  { label: 'GPT-OSS-20B', value: 'openai/gpt-oss-20b' },
  { label: 'Step-3.7-Flash', value: 'stepfun-ai/step-3.7-flash' },
  { label: 'Nemotron Ultra (Default)', value: 'nvidia/nemotron-3-ultra-550b-a55b' }
];

const getSettingsMenu = () => {
  const settings = getAgentSettings();
  return Markup.inlineKeyboard([
    [Markup.button.callback(`Thinking Mode: ${settings.thinking ? '[ON]' : '[OFF]'}`, 'toggle_thinking')],
    [Markup.button.callback(`Show Thinking (UI): ${settings.showThinking ? '[ON]' : '[OFF]'}`, 'toggle_show_thinking')],
    [Markup.button.callback(`Web Search: ${settings.enableWebSearch ? '[ON]' : '[OFF]'}`, 'toggle_web_search')],
    [Markup.button.callback(`Adv Web Search: ${settings.advWebSearch ? '[ON]' : '[OFF]'}`, 'toggle_adv_web_search')]
  ]);
};

function registerActions(bot) {
  bot.action('toggle_thinking', async (ctx) => {
    const current = getAgentSettings().thinking;
    updateAgentSettings({ thinking: !current });
    try {
      await ctx.answerCbQuery("Thinking mode toggled!");
      await ctx.editMessageReplyMarkup(getSettingsMenu().reply_markup);
    } catch (e) { /* ignore timeout/old query errors */ }
  });

  bot.action('toggle_show_thinking', async (ctx) => {
    const current = getAgentSettings().showThinking;
    updateAgentSettings({ showThinking: !current });
    try {
      await ctx.answerCbQuery("Show Thinking toggled!");
      await ctx.editMessageReplyMarkup(getSettingsMenu().reply_markup);
    } catch (e) { /* ignore timeout/old query errors */ }
  });

  bot.action('toggle_web_search', async (ctx) => {
    const current = getAgentSettings().enableWebSearch;
    updateAgentSettings({ enableWebSearch: !current });
    try {
      await ctx.answerCbQuery("Web Search toggled!");
      await ctx.editMessageReplyMarkup(getSettingsMenu().reply_markup);
    } catch (e) { /* ignore timeout/old query errors */ }
  });

  bot.action('toggle_adv_web_search', async (ctx) => {
    const current = getAgentSettings().advWebSearch;
    updateAgentSettings({ advWebSearch: !current });
    try {
      await ctx.answerCbQuery("Advanced Web Search toggled!");
      await ctx.editMessageReplyMarkup(getSettingsMenu().reply_markup);
    } catch (e) { /* ignore timeout/old query errors */ }
  });
}

const getModelMenu = () => {
  const current = getAgentSettings().model;
  const buttons = AVAILABLE_MODELS.map(m => {
    const marker = m.value === current ? ' [active]' : '';
    return [Markup.button.callback(`${m.label}${marker}`, `select_model_${m.value}`)];
  });
  return Markup.inlineKeyboard(buttons);
};

function registerActions(bot) {
  // Settings toggle handlers
  bot.action('toggle_thinking', async (ctx) => {
    const current = getAgentSettings().thinking;
    updateAgentSettings({ thinking: !current });
    try {
      await ctx.answerCbQuery('Thinking mode toggled!');
      await ctx.editMessageReplyMarkup(getSettingsMenu().reply_markup);
    } catch (e) { /* ignore timeout/old query errors */ }
  });

  bot.action('toggle_show_thinking', async (ctx) => {
    const current = getAgentSettings().showThinking;
    updateAgentSettings({ showThinking: !current });
    try {
      await ctx.answerCbQuery('Show Thinking toggled!');
      await ctx.editMessageReplyMarkup(getSettingsMenu().reply_markup);
    } catch (e) { /* ignore timeout/old query errors */ }
  });

  bot.action('toggle_web_search', async (ctx) => {
    const current = getAgentSettings().enableWebSearch;
    updateAgentSettings({ enableWebSearch: !current });
    try {
      await ctx.answerCbQuery('Web Search toggled!');
      await ctx.editMessageReplyMarkup(getSettingsMenu().reply_markup);
    } catch (e) { /* ignore timeout/old query errors */ }
  });

  bot.action('toggle_adv_web_search', async (ctx) => {
    const current = getAgentSettings().advWebSearch;
    updateAgentSettings({ advWebSearch: !current });
    try {
      await ctx.answerCbQuery('Advanced Web Search toggled!');
      await ctx.editMessageReplyMarkup(getSettingsMenu().reply_markup);
    } catch (e) { /* ignore timeout/old query errors */ }
  });

  // Model selection handler — matches any callback starting with 'select_model_'
  bot.action(/^select_model_(.+)$/, async (ctx) => {
    const modelValue = ctx.match[1];
    updateAgentSettings({ model: modelValue });
    try {
      const modelLabel = AVAILABLE_MODELS.find(m => m.value === modelValue)?.label || modelValue;
      await ctx.answerCbQuery(`Model switched to ${modelLabel}`);
      await ctx.editMessageReplyMarkup(getModelMenu().reply_markup);
    } catch (e) { /* ignore timeout/old query errors */ }
  });
}

module.exports = { registerActions, getSettingsMenu, getModelMenu };
