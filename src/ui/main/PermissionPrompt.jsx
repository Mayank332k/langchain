const React = require('react');
const { Box, Text, useInput } = require('ink');
const { formatToolCall } = require('../../utils/formatTool');
const theme = require('../theme');

function PermissionPrompt({ pendingPermission }) {
  const { toolName, args, target, callback } = pendingPermission;
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  
  const { action, detail } = formatToolCall(toolName, args);

  const alwaysLabel = target ? `Always Allow for ${target}` : `Always Allow for this action`;

  const OPTIONS = [
    { label: 'Yes (Run once)', value: true },
    { label: 'No (Skip)', value: false },
    { label: alwaysLabel, value: 'always' }
  ];

  useInput((input, key) => {
    if (key.upArrow) {
      setSelectedIndex(prev => Math.max(0, prev - 1));
    } else if (key.downArrow) {
      setSelectedIndex(prev => Math.min(OPTIONS.length - 1, prev + 1));
    } else if (key.return || input === ' ') {
      callback(OPTIONS[selectedIndex].value);
    } else if (input.toLowerCase() === 'y') {
      callback(true);
    } else if (input.toLowerCase() === 'n' || key.escape) {
      callback(false);
    }
  });

  return (
    <Box flexDirection="column" paddingX={1} marginY={0}>
      <Text bold color="yellow">Allow this action?</Text>
      <Box marginY={0}>
        <Text color={theme.colors.user}>{action} <Text bold dimColor>→</Text> <Text bold>{detail}</Text></Text>
      </Box>
      <Box flexDirection="column" marginTop={1}>
        {OPTIONS.map((opt, idx) => {
          const isSelected = idx === selectedIndex;
          return (
            <Box key={opt.value}>
              <Text color={isSelected ? 'yellow' : 'gray'}>
                {isSelected ? ' ❯ ' : '   '}
                {opt.label}
              </Text>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

module.exports = PermissionPrompt;
