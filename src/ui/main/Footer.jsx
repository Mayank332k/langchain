const React = require("react");
const { Box, Text } = require("ink");

function Footer({ modelName = "Unknown Model" }) {
  return (
    <Box flexDirection="row" width="100%">
      <Text dimColor>
        ⏸ kea · ? for settings · ⭠ {modelName}
      </Text>
    </Box>
  );
}

module.exports = Footer;
