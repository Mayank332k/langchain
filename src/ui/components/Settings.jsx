const React = require('react');
const { Box, Text, useInput } = require('ink');
const theme = require('../theme');
const { getAgentSettings, updateAgentSettings } = require('../../../services/agent_service');

const MODEL_GROUPS = [
  {
    label: 'gpt',
    models: [
      { label: 'gpt-oss-20b', value: 'openai/gpt-oss-20b' }
    ]
  },
  {
    label: 'nemotron',
    models: [
      { label: 'nemotron-3-ultra-550b-a55b', value: 'nvidia/nemotron-3-ultra-550b-a55b' }
    ]
  },
  {
    label: 'others',
    models: [
      { label: 'minimax-m3', value: 'minimaxai/minimax-m3' },
      { label: 'mistral-nemotron', value: 'mistralai/mistral-nemotron' }
    ]
  }
];

const MODEL_LEAVES = MODEL_GROUPS.flatMap((group, groupIndex) =>
  group.models.map((model, modelIndex) => ({
    ...model,
    groupLabel: group.label,
    groupIndex,
    modelIndex
  }))
);

function findModelIndex(modelValue) {
  const index = MODEL_LEAVES.findIndex((item) => item.value === modelValue);
  return index >= 0 ? index : 0;
}

function Settings({ onClose }) {
  const currentSettings = getAgentSettings();
  const [thinking, setThinking] = React.useState(currentSettings.thinking);
  const [showThinkingSetting, setShowThinkingSetting] = React.useState(currentSettings.showThinking);
  const [model, setModel] = React.useState(currentSettings.model);
  const [enableWebSearch, setEnableWebSearch] = React.useState(currentSettings.enableWebSearch !== false);
  const [advWebSearch, setAdvWebSearch] = React.useState(currentSettings.advWebSearch === true);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [activePane, setActivePane] = React.useState('main');
  const [modelIndex, setModelIndex] = React.useState(findModelIndex(currentSettings.model));

  const mainItemsCount = 6;

  React.useEffect(() => {
    setModelIndex(findModelIndex(model));
  }, [model]);

  const getPayload = (overrides) => ({
    thinking,
    showThinking: showThinkingSetting,
    model,
    enableWebSearch,
    advWebSearch,
    ...overrides
  });

  const commitModel = (nextModel) => {
    setModel(nextModel);
    updateAgentSettings(getPayload({ model: nextModel }));
  };

  const handleMainSelect = () => {
    if (selectedIndex === 0) {
      const nextThinking = !thinking;
      setThinking(nextThinking);
      updateAgentSettings(getPayload({ thinking: nextThinking }));
      return;
    }
    if (selectedIndex === 1) {
      const nextShowThinking = !showThinkingSetting;
      setShowThinkingSetting(nextShowThinking);
      updateAgentSettings(getPayload({ showThinking: nextShowThinking }));
      return;
    }
    if (selectedIndex === 2) {
      const nextEws = !enableWebSearch;
      setEnableWebSearch(nextEws);
      updateAgentSettings(getPayload({ enableWebSearch: nextEws }));
      return;
    }
    if (selectedIndex === 3) {
      const nextAws = !advWebSearch;
      setAdvWebSearch(nextAws);
      updateAgentSettings(getPayload({ advWebSearch: nextAws }));
      return;
    }
    if (selectedIndex === 4) {
      setActivePane('model');
      setModelIndex(findModelIndex(model));
      return;
    }
    if (selectedIndex === 5) {
      onClose();
    }
  };

  const handleModelSelect = () => {
    const selectedModel = MODEL_LEAVES[modelIndex];
    if (selectedModel) {
      commitModel(selectedModel.value);
    }
    setActivePane('main');
  };

  useInput((input, key) => {
    if (activePane === 'model') {
      if (key.upArrow) {
        setModelIndex((prev) => (prev - 1 + MODEL_LEAVES.length) % MODEL_LEAVES.length);
      } else if (key.downArrow) {
        setModelIndex((prev) => (prev + 1) % MODEL_LEAVES.length);
      } else if (key.return || input === ' ') {
        handleModelSelect();
      } else if (key.leftArrow || key.escape || input === 'q' || key.backspace) {
        setActivePane('main');
      }
      return;
    }

    if (key.upArrow) {
      setSelectedIndex((prev) => (prev - 1 + mainItemsCount) % mainItemsCount);
    } else if (key.downArrow) {
      setSelectedIndex((prev) => (prev + 1) % mainItemsCount);
    } else if (key.return || input === ' ') {
      handleMainSelect();
    } else if (key.escape || input === 'q') {
      onClose();
    }
  });

  const currentModelLabel = MODEL_LEAVES[modelIndex]?.label || model;

  const renderMainMenu = () => (
    <Box flexDirection="column" marginY={1}>
      <Box flexDirection="row">
        <Text color={selectedIndex === 0 ? theme.colors.primary : undefined}>
          {selectedIndex === 0 ? '❯ ' : '  '}
          Thinking Mode:
        </Text>
        <Text bold color={thinking ? 'green' : 'red'}>
          {' '}
          [{thinking ? 'ON' : 'OFF'}]
        </Text>
        <Text dimColor> (Space/Enter)</Text>
      </Box>

      <Box flexDirection="row" marginTop={1}>
        <Text color={selectedIndex === 1 ? theme.colors.primary : undefined}>
          {selectedIndex === 1 ? '❯ ' : '  '}
          Show Thinking in TUI:
        </Text>
        <Text bold color={showThinkingSetting ? 'green' : 'red'}>
          {' '}
          [{showThinkingSetting ? 'ON' : 'OFF'}]
        </Text>
        <Text dimColor> (Space/Enter)</Text>
      </Box>

      <Box flexDirection="row" marginTop={1}>
        <Text color={selectedIndex === 2 ? theme.colors.primary : undefined}>
          {selectedIndex === 2 ? '❯ ' : '  '}
          Web Search:
        </Text>
        <Text bold color={enableWebSearch ? 'green' : 'red'}>
          {' '}
          [{enableWebSearch ? 'ON' : 'OFF'}]
        </Text>
        <Text dimColor> (Space/Enter)</Text>
      </Box>

      <Box flexDirection="row" marginTop={1}>
        <Text color={selectedIndex === 3 ? theme.colors.primary : undefined}>
          {selectedIndex === 3 ? '❯ ' : '  '}
          Advanced Web Search (Tavily):
        </Text>
        <Text bold color={advWebSearch ? 'green' : 'red'}>
          {' '}
          [{advWebSearch ? 'ON' : 'OFF'}]
        </Text>
        <Text dimColor> (Space/Enter)</Text>
      </Box>

      <Box flexDirection="row" marginTop={1}>
        <Text color={selectedIndex === 4 ? theme.colors.primary : undefined}>
          {selectedIndex === 4 ? '❯ ' : '  '}
          Model:
        </Text>
        <Text bold color="cyan">
          {' '}
          [{currentModelLabel}]
        </Text>
        <Text dimColor> (Open tree)</Text>
      </Box>

      <Box flexDirection="row" marginTop={1}>
        <Text color={selectedIndex === 5 ? theme.colors.primary : undefined}>
          {selectedIndex === 5 ? '❯ ' : '  '}
          Exit and Save Settings
        </Text>
      </Box>
    </Box>
  );

  const renderModelTree = () => (
    <Box flexDirection="column" marginY={1}>
      <Text bold color={theme.colors.primary}>
        model
      </Text>

      {MODEL_GROUPS.map((group, groupIdx) => {
        const groupHasActiveModel = group.models.some((m) => m.value === model);
        const isLastGroup = groupIdx === MODEL_GROUPS.length - 1;

        return (
          <Box key={group.label} flexDirection="column" marginTop={1}>
            <Text color={groupHasActiveModel ? theme.colors.primary : 'white'}>
              {isLastGroup ? '└─ ' : '├─ '}{group.label}
            </Text>

            {group.models.map((leaf) => {
              const leafIndex = MODEL_LEAVES.findIndex((item) => item.value === leaf.value);
              const isSelected = leafIndex === modelIndex;
              const isActive = leaf.value === model;

              return (
                <Box key={leaf.value} flexDirection="row">
                  <Text color={isSelected ? theme.colors.primary : 'dim'}>
                    {isLastGroup ? '   ' : '│  '}└─ {isSelected ? '❯ ' : '  '}
                  </Text>
                  <Text bold={isSelected || isActive} color={isSelected ? theme.colors.primary : isActive ? 'cyan' : 'white'}>
                    {leaf.label}
                  </Text>
                  {isActive && (
                    <Text dimColor>
                      {' '}
                      [active]
                    </Text>
                  )}
                </Box>
              );
            })}
          </Box>
        );
      })}
    </Box>
  );

  return (
    <Box flexDirection="column" borderStyle="round" borderColor={theme.colors.primary} padding={1} width="100%">
      <Box position="absolute" top={-1} left={2}>
        <Text color={theme.colors.primary}> Settings Panel </Text>
      </Box>

      {activePane === 'main' ? renderMainMenu() : renderModelTree()}

      <Box
        borderStyle="single"
        borderTop={true}
        borderColor={theme.colors.primary}
        borderLeft={false}
        borderBottom={false}
        borderRight={false}
        paddingTop={0}
        marginTop={1}
      >
        <Text dimColor>
          {activePane === 'model'
            ? 'Up/Down to change model. Enter to select. Esc/Left/q to go back.'
            : 'Up/Down to move. Enter/Space to select. Esc/q to close.'}
        </Text>
      </Box>
    </Box>
  );
}

module.exports = Settings;
