const React = require("react");
const { Box, Text } = require("ink");
const theme = require("../theme");

const LOGO = `
██   ██ ███████  ▄█
██  ██  ██        ██
█████   █████      ██
██  ██  ██        ██
██   ██ ███████  ▀█
`;

function Logo() {
  return (
    <Box position="relative" height={6} width={30}>
      <Box position="absolute" top={1} left={1}>
        <Text color="#8B3A3A" bold>{LOGO}</Text>
      </Box>
      <Box position="absolute" top={0} left={0}>
        <Text color="#FF7F50" bold>{LOGO}</Text>
      </Box>
    </Box>
  );
}

function Header({
  modelName = "Unknown Model",
  isThinking = true,
  worker = "Idle",
}) {
  return (
    <Box
      borderStyle="round"
      borderColor="gray"
      flexDirection="row"
      paddingX={2}
      paddingY={1}
      width="100%"
      justifyContent="space-between"
      alignItems="center"
    >
      <Box flexShrink={0} marginRight={2}>
        <Logo />
      </Box>

      <Box flexDirection="column" alignItems="flex-end" flexShrink={1}>
        <Text bold color={theme.colors.ai} wrap="truncate">
          {modelName}
        </Text>
        <Text dimColor italic wrap="truncate">
          {worker}
        </Text>
        <Text dimColor>Thinking: {isThinking ? "On" : "Off"}</Text>
        <Text dimColor wrap="truncate">Type /settings to configure · ? for help</Text>
      </Box>
    </Box>
  );
}

module.exports = Header;
