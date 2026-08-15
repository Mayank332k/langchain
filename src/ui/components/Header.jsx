const React = require('react');
const { Box, Text } = require('ink');
const config = require('../../../config/settings');
const theme = require('../theme');

// Read terminal size once on startup to prevent re-rendering and duplicating borders on resize
const startupCols = process.stdout.columns || 80;
const startupIsSmall = startupCols < 80;
const startupIsMedium = startupCols >= 80 && startupCols < 120;

function Header() {
  const cols = startupCols;
  const isSmall = startupIsSmall;
  const isMedium = startupIsMedium;

  // Small screen: minimal skeleton only
  if (isSmall) {
    return (
      <Box flexDirection="column" width="100%">
        <Text bold color={theme.colors.primary}>kea v1.0.0</Text>
        <Text dimColor>Type 'exit' to quit. Type 'settings' for options.</Text>
      </Box>
    );
  }

  // Cute 8-bit invader robot mascot (Claude-like)
  const robot = [
    "         ▄█▄         ",
    "       ▄█▀ ▀█▄       ",
    "   ▄▄▀▀ ▄▀▀▀▄ ▀▀▄▄   ",
    "  █▀██  ▄▀▀▄  ██▀█  ",
    " ▀█████ █AI█ █████▀ ",
    "   ▀▀██ ▀██▀ ██▀▀   ",
    "      ▀▄▄██▄▄▀      ",
    "       ▄▀  ▀▄       ",
    "      ▀▀    ▀▀      "
  ];

  const modelShort = config.modelName.length > 30 ? config.modelName.split('/').pop().toUpperCase() : config.modelName.toUpperCase();
  const thinkingStatus = config.enableThinking ? "ON" : "OFF";

  return (
    <Box flexDirection="column" borderStyle="round" borderColor={theme.colors.primary} width={cols}>
      
      {/* Top Title */}
      <Box position="absolute" top={-1} left={2}>
        <Text color={theme.colors.primary}> kea v1.0.0 </Text>
      </Box>

      {/* Main Split Layout */}
      <Box flexDirection="row" width="100%">
        
        {/* Left Section (Robot, Welcome, Config Info, and Path) */}
        <Box width={45} flexDirection="column" alignItems="center" justifyContent="flex-start" paddingY={1}>
          <Text bold color="white">Welcome back!</Text>
          <Box flexDirection="column" marginY={0}>
            {robot.map((line, idx) => (
              <Text key={idx} color={theme.colors.primary}>{line}</Text>
            ))}
          </Box>
          <Box flexDirection="column" alignItems="center" marginTop={1}>
            <Text dimColor bold>MODEL: {modelShort} · THINKING: {thinkingStatus}</Text>
            <Text dimColor>~/Desktop/langchain</Text>
          </Box>
        </Box>

        {/* Vertical Divider (using a clean single vertical border box) */}
        <Box borderStyle="single" borderLeft={true} borderColor={theme.colors.primary} borderTop={false} borderBottom={false} borderRight={false} marginY={0} height="100%"></Box>

        {/* Right Section (Tips & What's new) */}
        <Box flexGrow={1} flexShrink={1} flexDirection="column" paddingX={2} paddingY={1}>
          
          <Box flexDirection="column" paddingBottom={1}>
            <Text bold color="white">Tips for getting started</Text>
            <Text color="white">Type 'exit' to quit. Type 'settings' to swap models or toggle thinking.</Text>
          </Box>
          
          {!isMedium && (
            <Box 
              borderStyle="single" 
              borderTop={true} 
              borderColor={theme.colors.primary} 
              borderLeft={false} 
              borderBottom={false} 
              borderRight={false} 
              paddingY={1} 
              flexDirection="column"
            >
              <Text bold color="white">What's new</Text>
              <Text color="white">• Integrated settings menu to dynamically choose models.</Text>
              <Text color="white">• Introduced autonomous web search capability.</Text>
              <Text color="white">• Polished, flicker-free developer TUI layout.</Text>
            </Box>
          )}

        </Box>
      </Box>

    </Box>
  );
}

module.exports = Header;
