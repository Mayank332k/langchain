const React = require('react');
const { Box, Text, useInput } = require('ink');
const theme = require('../theme');
const { getAgentSettings, updateAgentSettings } = require('../../../services/agent_service');

function Settings({ onClose }) {
  const currentSettings = getAgentSettings();
  const [thinking, setThinking] = React.useState(currentSettings.thinking);
  const [showThinkingSetting, setShowThinkingSetting] = React.useState(currentSettings.showThinking);
  const [model, setModel] = React.useState(currentSettings.model);
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  // Total menu items: 0: thinking, 1: showThinking, 2: model, 3: exit
  const menuItemsCount = 4;

  useInput((input, key) => {
    if (key.upArrow) {
      setSelectedIndex((prev) => (prev - 1 + menuItemsCount) % menuItemsCount);
    } else if (key.downArrow) {
      setSelectedIndex((prev) => (prev + 1) % menuItemsCount);
    } else if (key.return || input === ' ') {
      handleSelect();
    } else if (key.escape || input === 'q') {
      onClose();
    }
  });

  const handleSelect = () => {
    if (selectedIndex === 0) {
      const nextThinking = !thinking;
      setThinking(nextThinking);
      updateAgentSettings({ thinking: nextThinking, showThinking: showThinkingSetting, model });
    } else if (selectedIndex === 1) {
      const nextShowThinking = !showThinkingSetting;
      setShowThinkingSetting(nextShowThinking);
      updateAgentSettings({ thinking, showThinking: nextShowThinking, model });
    } else if (selectedIndex === 2) {
      const AVAILABLE_MODELS = [
        'openai/gpt-oss-20b',
        'nvidia/nemotron-3-ultra-550b-a55b'
      ];
      const currentIndex = AVAILABLE_MODELS.indexOf(model);
      const nextModel = AVAILABLE_MODELS[(currentIndex + 1) % AVAILABLE_MODELS.length] || AVAILABLE_MODELS[0];
      setModel(nextModel);
      updateAgentSettings({ thinking, showThinking: showThinkingSetting, model: nextModel });
    } else if (selectedIndex === 3) {
      onClose();
    }
  };

  return (
    <Box flexDirection="column" borderStyle="round" borderColor={theme.colors.primary} padding={1} width="100%">
      <Box position="absolute" top={-1} left={2}>
        <Text color={theme.colors.primary}> Settings Panel </Text>
      </Box>

      <Box flexDirection="column" marginY={1}>
        {/* Thinking Option */}
        <Box flexDirection="row">
          <Text color={selectedIndex === 0 ? theme.colors.primary : undefined}>
            {selectedIndex === 0 ? '❯ ' : '  '}
            Thinking Mode: 
          </Text>
          <Text bold color={thinking ? 'green' : 'red'}>
            {' '}[{thinking ? 'ON' : 'OFF'}]
          </Text>
          <Text dimColor> (Press Space/Enter to Toggle)</Text>
        </Box>

        {/* Show Thinking in TUI Option */}
        <Box flexDirection="row" marginTop={1}>
          <Text color={selectedIndex === 1 ? theme.colors.primary : undefined}>
            {selectedIndex === 1 ? '❯ ' : '  '}
            Show Thinking in TUI: 
          </Text>
          <Text bold color={showThinkingSetting ? 'green' : 'red'}>
            {' '}[{showThinkingSetting ? 'ON' : 'OFF'}]
          </Text>
          <Text dimColor> (Press Space/Enter to Toggle)</Text>
        </Box>

        {/* Model Option */}
        <Box flexDirection="row" marginTop={1}>
          <Text color={selectedIndex === 2 ? theme.colors.primary : undefined}>
            {selectedIndex === 2 ? '❯ ' : '  '}
            Active Model:  
          </Text>
          <Text bold color="cyan">
            {' '}[{model}]
          </Text>
          <Text dimColor> (Press Space/Enter to Toggle)</Text>
        </Box>

        {/* Exit Option */}
        <Box flexDirection="row" marginTop={1}>
          <Text color={selectedIndex === 3 ? theme.colors.primary : undefined}>
            {selectedIndex === 3 ? '❯ ' : '  '}
            Exit and Save Settings
          </Text>
        </Box>
      </Box>

      <Box borderStyle="single" borderTop={true} borderColor={theme.colors.primary} borderLeft={false} borderBottom={false} borderRight={false} paddingTop={0} marginTop={1}>
        <Text dimColor>Use Up/Down arrows to navigate. Press Escape or 'q' to go back.</Text>
      </Box>
    </Box>
  );
}

module.exports = Settings;
