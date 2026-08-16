const React = require('react');
const { useState, useEffect, useRef } = require('react');
const { Box, Text, useApp, useInput } = require('ink');
const Header = require('./components/Header');
const Chat = require('./components/Chat');
const Message = require('./components/Message');
const ToolCall = require('./components/ToolCall');
const Input = require('./components/Input');
const Settings = require('./components/Settings');
const useTerminalSize = require('./hooks/useTerminalSize');

// We need to require this dynamically or pass it as prop, but requiring directly works in node
const { processUserQueryStream, getAgentSettings, clearAgentHistory } = require('../../services/agent_service');

function App() {
  const { exit } = useApp();
  const size = useTerminalSize();
  const [messages, setMessages] = useState([{ role: 'header' }]);
  const [status, setStatus] = useState('');
  const [reasoningContent, setReasoningContent] = useState('');
  const [streamingContent, setStreamingContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [view, setView] = useState('chat'); // 'chat' or 'settings'

  const flushIntervalRef = useRef(null);
  const abortControllerRef = useRef(null);
  const contentBufferRef = useRef('');
  const reasoningBufferRef = useRef('');

  useEffect(() => {
    return () => {
      if (flushIntervalRef.current) {
        clearInterval(flushIntervalRef.current);
      }
    };
  }, []);

  // ESC key handler to abort generation
  useInput((input, key) => {
    if (key.escape && isProcessing) {
      // Abort the stream
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Clean up flush interval
      if (flushIntervalRef.current) {
        clearInterval(flushIntervalRef.current);
        flushIntervalRef.current = null;
      }

      // Save whatever was generated so far
      const partialContent = contentBufferRef.current;
      if (partialContent) {
        setMessages((prev) => [...prev, { role: 'ai', content: partialContent + '\n\n*[interrupted by user]*' }]);
      }

      setStatus('');
      setReasoningContent('');
      setStreamingContent('');
      setIsProcessing(false);
      contentBufferRef.current = '';
      reasoningBufferRef.current = '';
    }
  });

  const handleSubmit = async (query) => {
    const lowerQuery = query.toLowerCase().trim();
    if (lowerQuery === 'exit' || lowerQuery === 'quit') {
      exit();
      process.exit(0);
      return;
    }

    if (lowerQuery === '/setting' || lowerQuery === '/settings' || lowerQuery === 'settings' || lowerQuery === 'setting') {
      setView('settings');
      return;
    }

    if (lowerQuery === '/clear') {
      setMessages([{ role: 'header' }]);
      return;
    }

    if (lowerQuery === '/rc') {
      clearAgentHistory();
      setMessages((prev) => [...prev, { role: 'system', content: 'Context has been cleared.' }]);
      return;
    }

    setMessages((prev) => [...prev, { role: 'user', content: query }]);
    setIsProcessing(true);
    setStatus('Thinking...');
    setReasoningContent('');
    setStreamingContent('');

    // Create abort controller for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Reset buffer refs
    contentBufferRef.current = '';
    reasoningBufferRef.current = '';

    let isStreaming = false;

    // Clear any existing active interval before starting a new one
    if (flushIntervalRef.current) {
      clearInterval(flushIntervalRef.current);
    }

    // Flush to React state every 120ms (reduces rapid re-renders that cause terminal tearing)
    flushIntervalRef.current = setInterval(() => {
      if (contentBufferRef.current) {
        setStreamingContent(contentBufferRef.current);
      }
      if (reasoningBufferRef.current) {
        setReasoningContent(reasoningBufferRef.current);
      }
    }, 120);

    try {
      const finalAnswer = await processUserQueryStream(query, (event) => {
        // Check if aborted
        if (abortController.signal.aborted) return;

        if (event.type === 'status') {
          setStatus(event.message);
        } else if (event.type === 'tool_progress') {
          setStatus(event.message);
        } else if (event.type === 'reasoning') {
          reasoningBufferRef.current += event.token;
        } else if (event.type === 'token') {
          if (!isStreaming) {
            setStatus('');
            isStreaming = true;
          }
          contentBufferRef.current += event.token;
        } else if (event.type === 'error') {
          setMessages((prev) => [...prev, { role: 'error', content: event.message }]);
        }
      }, abortController.signal);

      if (abortController.signal.aborted) return;

      if (flushIntervalRef.current) {
        clearInterval(flushIntervalRef.current);
        flushIntervalRef.current = null;
      }
      setStatus('');
      setReasoningContent('');
      setStreamingContent('');
      setMessages((prev) => [...prev, { role: 'ai', content: finalAnswer, reasoning: reasoningBufferRef.current }]);
    } catch (err) {
      if (abortController.signal.aborted) return;

      if (flushIntervalRef.current) {
        clearInterval(flushIntervalRef.current);
        flushIntervalRef.current = null;
      }
      setStatus('');
      setReasoningContent('');
      setStreamingContent('');
      setMessages((prev) => [...prev, { role: 'error', content: err.message || String(err) }]);
    } finally {
      if (!abortController.signal.aborted) {
        setIsProcessing(false);
      }
      contentBufferRef.current = '';
      reasoningBufferRef.current = '';
    }
  };
  return (
    <Box flexDirection="column" width={size.columns}>
      <Box flexDirection="column" flexGrow={1} marginTop={1}>
        {view === 'settings' ? (
          <Settings onClose={() => setView('chat')} />
        ) : (
          <>
            <Chat messages={messages} showThinking={getAgentSettings().showThinking} />
            {!!reasoningContent && getAgentSettings().showThinking !== false && (
              <Box flexDirection="column" marginY={1}>
                <Text dimColor bold>💭 Thinking Process:</Text>
                <Box paddingLeft={2}>
                  <Text dimColor italic>{reasoningContent}</Text>
                </Box>
              </Box>
            )}
            {streamingContent !== '' && <Message role="ai" content={streamingContent} />}
            {status !== '' && <ToolCall status={status} />}
            {!isProcessing && <Input onSubmit={handleSubmit} />}
            {isProcessing && (
              <Box paddingLeft={2} marginTop={1}>
                <Text dimColor italic>Press ESC to interrupt</Text>
              </Box>
            )}
          </>
        )}
      </Box>
    </Box>
  );
}

module.exports = App;
