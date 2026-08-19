const React = require('react');
const { useState, useEffect } = require('react');
const { Box, Text, useInput } = require('ink');
const TextInput = require('ink-text-input').default;

const COMMANDS = [
  { value: '/settings', label: 'Open Settings (swap models, toggle thinking)' },
  { value: '/clear', label: 'Clear Chat UI' },
  { value: '/rc', label: 'Reset Agent Context / Memory' },
  { value: '/exit', label: 'Quit Application' }
];

function InputArea({ onSubmit, isProcessing, isPlanning }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const showMenu = query.startsWith('/');
  
  const filteredCommands = showMenu 
    ? COMMANDS.filter(cmd => cmd.value.toLowerCase().startsWith(query.toLowerCase()))
    : [];

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useInput((input, key) => {
    if (!showMenu || filteredCommands.length === 0) return;

    if (key.upArrow) {
      setSelectedIndex((prev) => Math.max(0, prev - 1));
    } else if (key.downArrow) {
      setSelectedIndex((prev) => Math.min(filteredCommands.length - 1, prev + 1));
    } else if (key.tab) {
      const selected = filteredCommands[selectedIndex];
      if (selected) setQuery(selected.value);
    }
  }, { isActive: showMenu });

  const handleSubmit = (value) => {
    if (isProcessing) return; // Prevent submission while agent is busy
    if (showMenu && filteredCommands[selectedIndex]) {
      const cmd = filteredCommands[selectedIndex].value;
      onSubmit(cmd);
      setQuery('');
      setSelectedIndex(0);
    } else if (value.trim()) {
      onSubmit(value);
      setQuery('');
    }
  };

  return (
    <Box flexDirection="column">
      {showMenu && filteredCommands.length > 0 && (
        <Box flexDirection="column" paddingX={2} paddingBottom={1}>
          {filteredCommands.map((cmd, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <Box key={cmd.value}>
                <Text color={isSelected ? 'yellow' : 'gray'}>
                  {isSelected ? ' ❯ ' : '   '}
                  {cmd.value}
                </Text>
                <Text dimColor>  - {cmd.label}</Text>
              </Box>
            );
          })}
        </Box>
      )}

      <Box paddingX={0} marginTop={showMenu && filteredCommands.length > 0 ? 0 : 0}>
        {isProcessing ? (
          <Box flexGrow={1} paddingLeft={2}>
            <Text dimColor italic>
              {isPlanning ? "Planning... (Press ESC to interrupt)" : "Press ESC to interrupt agent..."}
            </Text>
          </Box>
        ) : (
          <Box flexDirection="row" width="100%">
            <Text bold color={isPlanning ? "magenta" : undefined}>
              {isPlanning ? "[Plan Mode] ❯ " : "❯ "}
            </Text>
            <Box flexGrow={1} marginLeft={0}>
              <TextInput
                value={query}
                onChange={setQuery}
                onSubmit={handleSubmit}
                placeholder=""
              />
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}

module.exports = InputArea;
