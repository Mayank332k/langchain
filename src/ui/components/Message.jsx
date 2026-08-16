const React = require('react');
const { Box, Text } = require('ink');
const theme = require('../theme');
const MarkdownRenderer = require('./MarkdownRenderer');

function Message({ role, content, reasoning, showThinking }) {
  const isUser = role === 'user';
  const isError = role === 'error';
  const isSystem = role === 'system';

  const textColor = isError || isSystem ? theme.colors.error : 'white';

  return (
    <Box flexDirection="column" marginY={0} width="100%">
      {!isUser ? (
        <Box flexDirection="column" marginY={0}>
          <Box marginBottom={1}>
            <Text bold color={textColor}>
              {isError ? '🔥 Error' : '● Kea'}
            </Text>
          </Box>
          {!!reasoning && showThinking !== false && (
            <Box paddingLeft={2} marginBottom={1}>
              <Text dimColor italic>💭 {reasoning}</Text>
            </Box>
          )}
          <Box paddingLeft={2} flexDirection="column">
            <MarkdownRenderer content={content} textColor={textColor} />
          </Box>
        </Box>
      ) : (
        <Box 
          flexDirection="row"
          paddingY={0}
          paddingX={1}
          marginX={0}
          width="100%"
        >
          <Text color="#58a6ff" bold>❯ </Text>
          <Box flexGrow={1} flexShrink={1}>
            <MarkdownRenderer content={content} textColor="#58a6ff" boldText={true} bgGray={false} />
          </Box>
        </Box>
      )}
    </Box>
  );
}

module.exports = Message;
