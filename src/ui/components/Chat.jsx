const React = require('react');
const { Box, Static } = require('ink');
const Message = require('./Message');
const Header = require('./Header');

function Chat({ messages, showThinking }) {
  return (
    <Static items={messages}>
      {(msg, idx) => {
        if (msg.role === 'header') {
          return <Header key={`header-${idx}`} />;
        }
        return (
          <Box key={`msg-${idx}`} flexDirection="column" width="100%" marginBottom={1}>
            <Message role={msg.role} content={msg.content} reasoning={msg.reasoning} showThinking={showThinking} />
          </Box>
        );
      }}
    </Static>
  );
}

module.exports = Chat;
