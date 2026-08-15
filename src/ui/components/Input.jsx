const React = require('react');
const { Box, Text, useInput } = require('ink');
const TextInput = require('ink-text-input').default;
const theme = require('../theme');

function Input({ onSubmit }) {
  const [query, setQuery] = React.useState('');
  const [showCursor, setShowCursor] = React.useState(true);
  
  const blinkIntervalRef = React.useRef(null);
  const blinkTimeoutRef = React.useRef(null);

  const startBlinking = () => {
    clearInterval(blinkIntervalRef.current);
    blinkIntervalRef.current = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 500);
  };

  const resetBlink = () => {
    setShowCursor(true);
    clearInterval(blinkIntervalRef.current);
    clearTimeout(blinkTimeoutRef.current);
    blinkTimeoutRef.current = setTimeout(startBlinking, 500);
  };

  React.useEffect(() => {
    startBlinking();
    return () => {
      clearInterval(blinkIntervalRef.current);
      clearTimeout(blinkTimeoutRef.current);
    };
  }, []);

  useInput((input, key) => {
    resetBlink();

    // Command + Delete (often maps to Ctrl+U in terminals)
    if (key.ctrl && input === 'u') {
      setQuery('');
      return;
    }

    // Option + Delete (often maps to Meta+Backspace or Ctrl+W)
    if ((key.meta && (key.backspace || key.delete)) || (key.ctrl && input === 'w')) {
      setQuery((prev) => prev.trimEnd().replace(/\S+$/, ''));
      return;
    }
  });

  const handleChange = (val) => {
    setQuery(val);
    resetBlink();
  };

  const handleSubmit = (val) => {
    if (val.trim()) {
      setQuery('');
      onSubmit(val);
    }
  };

  return (
    <Box flexDirection="column" marginTop={0}>
      <Box 
        borderStyle="single"
        borderTop={true}
        borderBottom={false}
        borderLeft={false}
        borderRight={false}
        borderColor="gray"
        flexDirection="row"
        paddingX={1}
        paddingY={0}
        width="100%"
      >
        <Text color="#58a6ff" bold>❯ </Text>
        <Text color="white">
          <TextInput
            value={query}
            onChange={handleChange}
            onSubmit={handleSubmit}
            placeholder={query ? '' : 'Type your message or "exit" to quit'}
            showCursor={showCursor}
          />
        </Text>
      </Box>
    </Box>
  );
}

module.exports = Input;
