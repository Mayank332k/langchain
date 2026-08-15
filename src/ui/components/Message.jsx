const React = require('react');
const { Box, Text } = require('ink');
const theme = require('../theme');
const MarkdownRenderer = require('./MarkdownRenderer');

function Message({ role, content, reasoning, showThinking }) {
  const isUser = role === 'user';
  const isError = role === 'error';

  return (
    <Box flexDirection="column" marginY={0} width="100%">
      {!isUser ? (
        <Box flexDirection="column" marginY={0}>
          <Box flexDirection="row">
            <Text bold color={isError ? theme.colors.error : 'white'}>
              {isError ? '🔥 ' : '● '}
            </Text>
            <Box flexGrow={1} flexShrink={1}>
              <MarkdownRenderer content={content} textColor={isError ? theme.colors.error : 'white'} />
            </Box>
          </Box>
          {reasoning !== '' && showThinking !== false && (
            <Box paddingLeft={0} marginTop={1}>
              <Text dimColor>* {reasoning}</Text>
            </Box>
          )}
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
