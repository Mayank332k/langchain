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
  const isSearch = statusLower.includes('search') || statusLower.includes('source') || statusLower.includes('research') || statusLower.includes('web');

  const sparkleFrames = ['✹', '✫', '✦', '✧', '✵', '❆', '✣', '✦'];
  const shimmerColors = [
    '#663538', '#7A4245', '#8E4F52', '#A25C5F',
    '#B6696C', '#CC6F74', '#E08589', '#CC6F74',
    '#B6696C', '#A25C5F', '#8E4F52', '#7A4245'
  ];
  const orbitFrames = ['◐', '◓', '◑', '◒'];

  useEffect(() => {
    let interval;
    if (isThinking || isSearch) {
      interval = setInterval(() => {
        setAnimIdx((prev) => prev + 1);
      }, isThinking ? 140 : 120);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isThinking, isSearch]);

  if (isThinking) {
    const currentFrame = sparkleFrames[animIdx % sparkleFrames.length];
    const currentColor = shimmerColors[animIdx % shimmerColors.length];
    return (
      <Box paddingLeft={2} marginY={1}>
        <Text bold color={currentColor}>
          {currentFrame} {status}
        </Text>
      </Box>
    );
  }

  if (isSearch) {
    const currentFrame = orbitFrames[animIdx % orbitFrames.length];
    return (
      <Box paddingLeft={2} marginY={1}>
        <Text bold color={theme.colors.primary}>
          {currentFrame} {status}
        </Text>
      </Box>
    );
  }

  let spinnerColor = 'cyan';
  let spinnerType = 'dots';

  if (statusLower.includes('sneak') || statusLower.includes('search')) {
    spinnerColor = 'green';
    spinnerType = 'dots';
  } else if (statusLower.includes('reading') || statusLower.includes('got')) {
    spinnerColor = 'magenta';
    spinnerType = 'bouncingBar';
  } else if (statusLower.includes('running')) {
    spinnerColor = 'blue';
    spinnerType = 'pipe';
  }

  return (
    <Box paddingLeft={2} marginY={1}>
      <Text bold color={spinnerColor}>
        <Spinner type={spinnerType} />
        {' '}{status}
      </Text>
    </Box>
  );
}

module.exports = ToolCall;
