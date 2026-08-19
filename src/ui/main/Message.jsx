const React = require('react');
const { Box, Text } = require('ink');
const MarkdownRenderer = require('./MarkdownRenderer');
const theme = require('../theme');

function Message({ role, content, reasoning }) {
  if (role === 'header' || role === 'system') return null;
  if (!content && !reasoning) return null;

  const isUser = role === 'user';
  
  return (
    <Box flexDirection="column" marginY={0} marginBottom={2} width="100%">
      {isUser ? (
        <Box flexDirection="row" width="100%">
          <Text dimColor>❯ </Text>
          <Box flexShrink={1} flexGrow={1}>
            <Text color={theme.colors.user}>{content}</Text>
          </Box>
        </Box>
      ) : (
        <Box flexDirection="column" width="100%" marginTop={1}>
          {!!reasoning && (
            <Box 
              flexDirection="column" 
              marginBottom={1} 
              paddingLeft={2} 
              borderStyle="single" 
              borderLeft={true} 
              borderTop={false} 
              borderRight={false} 
              borderBottom={false} 
              borderColor="gray"
            >
              <Text dimColor italic>{reasoning}</Text>
            </Box>
          )}

          {!!content && (
            <Box flexDirection="row" width="100%">
              <Box marginRight={1} flexShrink={0}>
                <Text bold color={theme.colors.primary}>:-&#125;</Text>
              </Box>
              <Box flexDirection="column" flexShrink={1} flexGrow={1}>
                <MarkdownRenderer content={content} />
              </Box>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}

module.exports = React.memo(Message);
