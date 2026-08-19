const React = require('react');
const { useState, useEffect } = require('react');
const { Box, Text } = require('ink');
const Spinner = require('ink-spinner').default;
const theme = require('../theme');

function ToolCall({ status }) {
  if (!status) return null;

  const [animIdx, setAnimIdx] = useState(0);
  const statusLower = status.toLowerCase();
  const isThinking = statusLower.includes('thinking');
  const isSearch = statusLower.includes('search') || statusLower.includes('source') || statusLower.includes('research') || statusLower.includes('web') || statusLower.includes('reading file');

  const sparkleFrames = [':', '→', '–', '}', '{', ')', '('];
  const shimmerColors = [
    '#555555', '#777777', '#999999', '#BBBBBB',
    '#DDDDDD', '#FFFFFF', '#DDDDDD', '#BBBBBB',
    '#999999', '#777777', '#555555', '#333333'
  ];
  const orbitFrames = [':', '→', '–', '}', '{', ')', '('];

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimIdx((prev) => prev + 1);
    }, 140);
    return () => clearInterval(interval);
  }, []);

  if (isThinking) {
    const currentFrame = sparkleFrames[animIdx % sparkleFrames.length];
    const currentColor = shimmerColors[animIdx % shimmerColors.length];
    return (
      <Box marginY={1}>
        <Text bold color={currentColor}>
          {currentFrame} {status}
        </Text>
      </Box>
    );
  }

  if (isSearch) {
    const currentFrame = orbitFrames[animIdx % orbitFrames.length];
    return (
      <Box marginY={1}>
        <Text bold color={theme.colors.primary}>
          {currentFrame} {status}
        </Text>
      </Box>
    );
  }

  // Fallback to custom sparkle frames with primary color instead of ink-spinner
  let fallbackColor = theme.colors.primary;
  
  if (statusLower.includes('sneak')) {
    fallbackColor = 'green';
  } else if (statusLower.includes('reading') || statusLower.includes('got')) {
    fallbackColor = 'magenta';
  } else if (statusLower.includes('running')) {
    fallbackColor = 'blue';
  }

  const currentFrame = sparkleFrames[animIdx % sparkleFrames.length];

  return (
    <Box marginY={1}>
      <Text bold color={fallbackColor}>
        {currentFrame} {status}
      </Text>
    </Box>
  );
}

module.exports = ToolCall;
