const { useState, useRef, useEffect } = require('react');
const { useInput, useApp } = require('ink');
const { processUserQueryStream, getAgentSettings, clearAgentHistory } = require('../../../services/agent_service');
const permissionBus = require('../../utils/permissionBus');

function useAgent() {
  const { exit } = useApp();
  const [messages, setMessages] = useState([{ role: 'header' }]);
  const [status, setStatus] = useState('');
  const [reasoningContent, setReasoningContent] = useState('');
  const [streamingContent, setStreamingContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [view, setView] = useState('chat'); // 'chat' or 'settings'
  const [pendingPermission, setPendingPermission] = useState(null);
  const [isPlanning, setIsPlanning] = useState(false);

  const mounted = useRef(true);
  const flushIntervalRef = useRef(null);
  const abortControllerRef = useRef(null);
  const contentBufferRef = useRef('');
  const reasoningBufferRef = useRef('');

  useEffect(() => {
    const handleRequest = (req) => {
      setPendingPermission(req);
    };
    permissionBus.on('request', handleRequest);

    return () => {
      mounted.current = false;
      permissionBus.off('request', handleRequest);
      if (flushIntervalRef.current) {
        clearInterval(flushIntervalRef.current);
      }
    };
  }, []);

  // ESC key handler to abort generation
  useInput((input, key) => {
    if (key.escape && isProcessing) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (flushIntervalRef.current) {
        clearInterval(flushIntervalRef.current);
        flushIntervalRef.current = null;
      }
      const partialContent = contentBufferRef.current;
      if (partialContent) {
        setMessages((prev) => [...prev, { role: 'ai', content: partialContent + '\n\n*[interrupted by user]*' }]);
      }
      setStatus('');
      setReasoningContent('');
      setStreamingContent('');
      setIsProcessing(false);
      setIsPlanning(false);
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

    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    contentBufferRef.current = '';
    reasoningBufferRef.current = '';
    let isStreaming = false;

    if (flushIntervalRef.current) {
      clearInterval(flushIntervalRef.current);
    }

    flushIntervalRef.current = setInterval(() => {
      if (!mounted.current) return;
      if (contentBufferRef.current) {
        setStreamingContent(contentBufferRef.current);
      }
      if (reasoningBufferRef.current) {
        setReasoningContent(reasoningBufferRef.current);
      }
    }, 120);

    try {
      const finalAnswer = await processUserQueryStream(query, (event) => {
        if (abortController.signal.aborted || !mounted.current) return;
        if (event.type === 'status' || event.type === 'tool_progress') {
          setStatus(event.message);
        } else if (event.type === 'tool_call') {
          if (event.name === 'enter_plan_mode') setIsPlanning(true);
          if (event.name === 'exit_plan_mode') setIsPlanning(false);
          setMessages((prev) => [...prev, { role: 'tool_call', name: event.name, args: event.args }]);
        } else if (event.type === 'tool_result') {
          setMessages((prev) => [...prev, { role: 'tool_result', name: event.name, output: event.output }]);
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
      if (mounted.current) {
        setStatus('');
        setReasoningContent('');
        setStreamingContent('');
        setMessages((prev) => [...prev, { role: 'ai', content: finalAnswer, reasoning: reasoningBufferRef.current }]);
      }
    } catch (err) {
      if (abortController.signal.aborted || !mounted.current) return;
      if (flushIntervalRef.current) {
        clearInterval(flushIntervalRef.current);
        flushIntervalRef.current = null;
      }
      if (mounted.current) {
        setStatus('');
        setReasoningContent('');
        setStreamingContent('');
        setMessages((prev) => [...prev, { role: 'error', content: err.message || String(err) }]);
      }
    } finally {
      if (mounted.current && !abortController.signal.aborted) {
        setIsProcessing(false);
      }
      contentBufferRef.current = '';
      reasoningBufferRef.current = '';
    }
  };

  return {
    messages,
    status,
    reasoningContent,
    streamingContent,
    isProcessing,
    view,
    setView,
    handleSubmit,
    getAgentSettings,
    pendingPermission,
    setPendingPermission,
    isPlanning
  };
}

module.exports = useAgent;
