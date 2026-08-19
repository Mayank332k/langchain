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
      return <Text key={idx} color={theme.colors.user}>{part.slice(1, -1)}</Text>;
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

    // Detect tables
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      let j = i;
      const tableLines = [];
      while (j < lines.length && lines[j].trim().startsWith('|') && lines[j].trim().endsWith('|')) {
        tableLines.push(lines[j]);
        j++;
      }
      
      // Parse table
      const parsedRows = tableLines
        .filter(l => !l.match(/^\|?[\s-:]+\|/)) // filter out the divider row like |---|---|
        .map(l => {
          const cells = l.split('|').map(cell => cell.trim());
          cells.shift(); // remove empty before first |
          cells.pop();   // remove empty after last |
          return cells;
        });

      if (parsedRows.length > 0) {
        const numCols = parsedRows[0].length;
        const colWidth = Math.floor(100 / numCols);

        renderedElements.push(
          <Box key={`table-${i}`} flexDirection="column" borderStyle="single" borderColor={theme.colors.primary} marginY={1}>
            {parsedRows.map((row, rowIdx) => {
              const isHeader = rowIdx === 0;
              return (
                <Box 
                  key={`row-${rowIdx}`} 
                  flexDirection="row" 
                  borderStyle={isHeader ? "single" : undefined}
                  borderBottom={isHeader}
                  borderTop={false} borderLeft={false} borderRight={false}
                  borderColor={theme.colors.primary}
                >
                  {row.map((cell, colIdx) => (
                    <Box 
                      key={`cell-${colIdx}`} 
                      width={`${colWidth}%`} 
                      paddingX={1}
                      borderStyle={colIdx < row.length - 1 ? "single" : undefined}
                      borderRight={colIdx < row.length - 1}
                      borderTop={false} borderBottom={false} borderLeft={false}
                      borderColor={theme.colors.primary}
                    >
                      <Box flexDirection="row" flexWrap="wrap">
                        {parseInline(cell, textColor, { bold: isHeader || boldText, bgGray })}
                      </Box>
                    </Box>
                  ))}
                </Box>
              );
            })}
          </Box>
        );
      }
      
      i = j - 1; // skip processed lines
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
            <Box key={i} marginY={1}>
              <Text>{inlineElements}</Text>
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
            <Box flexShrink={1} flexGrow={1}>
              <Text>{inlineElements}</Text>
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
          <Box key={i} paddingLeft={0} marginY={0}>
            <Text>{inlineElements}</Text>
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

module.exports = React.memo(MarkdownRenderer);
