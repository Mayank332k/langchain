const React = require('react');
const { Box, Text } = require('ink');
const Spinner = require('ink-spinner').default;
const Message = require('./Message');
const ToolCall = require('./ToolCall');
const { formatToolCall } = require('../../utils/formatTool');
const theme = require('../theme');

const shimmerColors = [
  '#A2A8F7', '#B3B8F8', '#C4C9F9', '#D5D9FA', '#E6E9FC', '#D5D9FA', '#C4C9F9', '#B3B8F8'
];

function AnimatedToolCall({ action, detail, isCompleted }) {
  const [animIdx, setAnimIdx] = React.useState(0);
  
  React.useEffect(() => {
    if (isCompleted) return;
    const interval = setInterval(() => {
      setAnimIdx(prev => prev + 1);
    }, 120);
    return () => clearInterval(interval);
  }, [isCompleted]);

  const color = isCompleted ? "green" : shimmerColors[animIdx % shimmerColors.length];
  const arrowColor = isCompleted ? "green" : "gray";

  return (
    <Box marginY={0} paddingX={1}>
      <Text color={color}>
        {action} <Text bold color={arrowColor}>→</Text> <Text bold>{detail}</Text>
      </Text>
    </Box>
  );
}

function ChatArea({ messages, streamingContent, status, reasoningContent, showThinking }) {
  const extractContentAndReasoning = (contentStr, reasoningStr) => {
    let c = typeof contentStr === 'string' ? contentStr : '';
    let r = typeof reasoningStr === 'string' ? reasoningStr : '';
    
    if (c.includes('<think>')) {
      const match = c.match(/<think>([\s\S]*?)(?:<\/think>|$)/);
      if (match) {
        r = r ? r + '\n' + match[1] : match[1];
        c = c.replace(/<think>[\s\S]*?(?:<\/think>|$)/, '').trimStart();
      }
    }
    return { c, r };
  };

  // Pre-process messages to determine completion status for tool calls
  const processedMessages = messages.map((msg, index) => {
    if (msg.role === 'tool_call') {
      let isCompleted = false;
      for (let i = index + 1; i < messages.length; i++) {
        if (messages[i].role === 'tool_result' && messages[i].name === msg.name) {
          isCompleted = true;
          break;
        }
        if (messages[i].role === 'ai' || messages[i].role === 'error') {
          isCompleted = true;
          break;
        }
      }
      // If we are no longer processing and this is the end of the history, it must be complete
      if (status === '' && streamingContent === '' && index === messages.length - 1) {
         isCompleted = true; // Though technically it might not have run if there was a fatal error, but for UI it's done.
      }
      return { ...msg, isCompleted };
    }
    return msg;
  });

  // Filter out hidden tool results so they don't consume the visible slice window
  const visibleMessages = processedMessages.filter(msg => {
    if (msg.role === 'tool_result' && msg.name !== 'AskUserQuestion') {
      return false;
    }
    return true;
  });

  return (
    <Box flexDirection="column" paddingX={2}>
      {visibleMessages.slice(-10).map((msg, index) => {
        if (msg.role === 'tool_call') {
          const { action, detail } = formatToolCall(msg.name, msg.args, msg.isCompleted);
          return (
            <AnimatedToolCall 
              key={`tool-${index}`} 
              action={action} 
              detail={detail} 
              isCompleted={msg.isCompleted} 
            />
          );
        }
        if (msg.role === 'tool_result') {
          if (msg.name === 'AskUserQuestion') {
            const outputText = typeof msg.output === 'string' ? msg.output : JSON.stringify(msg.output);
            return (
              <Box key={`result-${index}`} marginY={1} paddingX={2} borderStyle="round" borderColor="#A2A8F7" flexDirection="column">
                <Text>{outputText}</Text>
              </Box>
            );
          }
          return null;
        }

        const { c, r } = extractContentAndReasoning(msg.content, msg.reasoning);
        return (
          <Message 
            key={index} 
            role={msg.role} 
            content={c} 
            reasoning={showThinking ? r : ''} 
          />
        );
      })}
      
      {/* Streaming Agent Reply */}
      {(streamingContent !== '' || reasoningContent !== '') && (() => {
        const { c, r } = extractContentAndReasoning(streamingContent, reasoningContent);
        return (
          <Message 
            role="ai" 
            content={c} 
            reasoning={showThinking ? r : ''} 
          />
        );
      })()}

      {/* Tool Progress Status */}
      {status !== '' && (
        <ToolCall status={status} />
      )}
    </Box>
  );
}

module.exports = ChatArea;
