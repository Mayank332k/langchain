const React = require('react');
const { Box, Text } = require('ink');
const { highlight } = require('cli-highlight');
const theme = require('../theme');

/**
 * Parses inline markdown: bold (**), italic (*), and inline code (`)
 */
function parseInline(text, textColor, options = {}) { const bg = options.bgGray ? "#333333" : undefined;
  if (!text) return null;

  // Split by bold (**), italic (*), and inline code (`)
  const regex = /(\*\*.*?\*\*|`.*?`|\*.*?\*)/g;
  const parts = text.split(regex).filter(p => p !== '');

  return parts.map((part, idx) => {
    const isBold = options.bold || false;
    const isUnderline = options.underline || false;
    const isItalic = options.italic || false;

    if (part.startsWith('**') && part.endsWith('**')) {
      return <Text key={idx} bold={true} underline={isUnderline} color={textColor} backgroundColor={bg}>{part.slice(2, -2)}</Text>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <Text key={idx} italic={true} underline={isUnderline} color={textColor} backgroundColor={bg}>{part.slice(1, -1)}</Text>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <Text key={idx} color="black" backgroundColor={theme.colors.primary}> {part.slice(1, -1)} </Text>;
    }
    return <Text key={idx} bold={isBold} underline={isUnderline} italic={isItalic} color={textColor} backgroundColor={bg}>{part}</Text>;
  });
}

/**
 * Custom light-weight, streaming-safe Markdown Renderer for TUI
 */
function MarkdownRenderer({ content, textColor, boldText = false, bgGray = false }) {
  if (!content) return null;

  const lines = content.split('\n');
  const renderedElements = [];
  let inCodeBlock = false;
  let codeBlockLines = [];
  let codeBlockLanguage = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Toggle code blocks
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        // Render completed code block with syntax highlighting
        let highlightedCode = '';
        const rawCode = codeBlockLines.join('\n');
        try {
          highlightedCode = highlight(rawCode, {
            language: codeBlockLanguage || 'javascript',
            ignoreIllegals: true
          });
        } catch (e) {
          highlightedCode = rawCode;
        }

        renderedElements.push(
          <Box
            key={`code-${i}`}
            flexDirection="column"
            paddingLeft={2} marginY={1}
          >
            {codeBlockLanguage !== '' ? (
              <Box paddingBottom={0}>
                <Text color="cyan" bold>{codeBlockLanguage.toUpperCase()}</Text>
              </Box>
            ) : null}
            {highlightedCode ? <Text>{highlightedCode}</Text> : <Text> </Text>}
          </Box>
        );
        codeBlockLines = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
        codeBlockLanguage = line.slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }

    // Render headings (#)
    if (line.startsWith('#')) {
      const match = line.match(/^(#{1,6})\s+(.*)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2];
        const inlineElements = parseInline(text, theme.colors.primary, { bold: true, underline: level === 1 });
        if (inlineElements && inlineElements.length > 0) {
          renderedElements.push(
            <Box key={i} marginY={1} flexDirection="row" flexWrap="wrap">
              {inlineElements}
            </Box>
          );
        }
        continue;
      }
    }

    // Render list items (- or *)
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      // Find where list content starts
      const cleanLine = line.trim();
      const text = cleanLine.slice(2);
      const inlineElements = parseInline(text, textColor, { bold: boldText, bgGray });
      if (inlineElements && inlineElements.length > 0) {
        renderedElements.push(
          <Box key={i} paddingLeft={2} flexDirection="row">
            <Text color={textColor}>• </Text>
            <Box flexDirection="row" flexWrap="wrap">
              {inlineElements}
            </Box>
          </Box>
        );
      }
      continue;
    }

    // Standard lines
    if (line.trim() !== '') {
      const inlineElements = parseInline(line, textColor, { bold: boldText, bgGray });
      if (inlineElements && inlineElements.length > 0) {
        renderedElements.push(
          <Box key={i} paddingLeft={0} marginY={0} flexDirection="row" flexWrap="wrap">
            {inlineElements}
          </Box>
        );
      }
    } else {
      // Skip empty lines to prevent large gaps in terminal output
      continue;
    }
  }

  // Handle live streaming open code block (still writing code)
  if (inCodeBlock && codeBlockLines.length > 0) {
    let openHighlightedCode = '';
    const rawOpenCode = codeBlockLines.join('\n');
    try {
      openHighlightedCode = highlight(rawOpenCode, {
        language: codeBlockLanguage || 'javascript',
        ignoreIllegals: true
      });
    } catch (e) {
      openHighlightedCode = rawOpenCode;
    }

    renderedElements.push(
      <Box
        key="code-open"
        flexDirection="column"
        paddingLeft={2} marginY={1}
      >
        <Text color="cyan" bold>{(codeBlockLanguage || 'code').toUpperCase()} (writing...)</Text>
        {openHighlightedCode ? <Text>{openHighlightedCode}</Text> : <Text> </Text>}
      </Box>
    );
  }

  return <Box flexDirection="column" width="100%">{renderedElements}</Box>;
}

module.exports = MarkdownRenderer;
