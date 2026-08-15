const stringWidth = require('string-width');

/**
 * ANSI RGB color converter
 */
function hexToAnsi(hex) {
  let c = hex.substring(1).split('');
  if (c.length === 3) {
    c = [c[0], c[0], c[1], c[1], c[2], c[2]];
  }
  c = '0x' + c.join('');
  const r = (c >> 16) & 255;
  const g = (c >> 8) & 255;
  const b = c & 255;
  return `\x1b[38;2;${r};${g};${b}m`;
}

const RESET = "\x1b[0m";
const PRIMARY_COLOR = hexToAnsi("#7DCCAD"); // Updated to user's preferred color
const DIM = "\x1b[2m";
const BOLD = "\x1b[1m";

// Helper to pad text with spaces to a fixed visual width, ignoring hidden ANSI codes
function padText(text, width) {
  const visibleLength = stringWidth(text);
  const paddingNeeded = Math.max(0, width - visibleLength);
  return text + ' '.repeat(paddingNeeded);
}

function printRoboBanner() {
  console.clear();
  
  // Calculate terminal width dynamically, leaving a 2-char margin to prevent line wrapping bugs
  const termWidth = Math.max(80, (process.stdout.columns || 100) - 2);
  
  // Left side gets a fixed width of 45, Right side gets the rest
  const leftW = 45;
  const rightW = Math.max(30, termWidth - leftW - 3); 

  const robot = [
    "   ▄▄  ▄▄   ",
    "  ████████  ",
    "  ██ ▀▀ ██  ",
    "  ▀█ ▀▀ █▀  ",
    "   ▀    ▀   "
  ];

  // Helper for border lines
  const H = "─";
  const V = "│";

  // Top border
  const title = " LangChain Assistant v1.0.0 ";
  const topBarLeft = "╭" + H.repeat(2) + title + H.repeat(Math.max(0, leftW - 2 - title.length));
  const topBarRight = H.repeat(rightW) + "╮";
  console.log(`${PRIMARY_COLOR}${topBarLeft}┬${topBarRight}${RESET}`);

  // Row 1
  const l1 = padText(`              Welcome back!`, leftW);
  const r1 = padText(` ${BOLD}Tips for getting started${RESET}${PRIMARY_COLOR}`, rightW);
  console.log(`${PRIMARY_COLOR}${V}${RESET}${l1}${PRIMARY_COLOR}${V}${RESET}${r1}${PRIMARY_COLOR}${V}${RESET}`);

  // Row 2
  const l2 = padText(``, leftW);
  const r2 = padText(` Type 'exit' to quit or ask any real-time`, rightW);
  console.log(`${PRIMARY_COLOR}${V}${RESET}${l2}${PRIMARY_COLOR}${V}${RESET}${r2}${PRIMARY_COLOR}${V}${RESET}`);

  // Row 3
  const l3 = padText(`              ${robot[0]}`, leftW);
  const r3 = padText(` questions. Deep Web Scraper is active.`, rightW);
  console.log(`${PRIMARY_COLOR}${V}${RESET}${l3}${PRIMARY_COLOR}${V}${RESET}${r3}${PRIMARY_COLOR}${V}${RESET}`);

  // Divider for right column
  const l4 = padText(`              ${robot[1]}`, leftW);
  const rDivider = H.repeat(rightW);
  console.log(`${PRIMARY_COLOR}${V}${RESET}${l4}${PRIMARY_COLOR}├${rDivider}┤${RESET}`);

  // Row 5
  const l5 = padText(`              ${robot[2]}`, leftW);
  const r5 = padText(` ${BOLD}What's new${RESET}${PRIMARY_COLOR}`, rightW);
  console.log(`${PRIMARY_COLOR}${V}${RESET}${l5}${PRIMARY_COLOR}${V}${RESET}${r5}${PRIMARY_COLOR}${V}${RESET}`);

  // Row 6
  const l6 = padText(`              ${robot[3]}`, leftW);
  const r6 = padText(` • Integrated duck-duck-scrape with Zod.`, rightW);
  console.log(`${PRIMARY_COLOR}${V}${RESET}${l6}${PRIMARY_COLOR}${V}${RESET}${r6}${PRIMARY_COLOR}${V}${RESET}`);

  // Row 7
  const l7 = padText(`              ${robot[4]}`, leftW);
  const r7 = padText(` • Live token streaming and Ora animations.`, rightW);
  console.log(`${PRIMARY_COLOR}${V}${RESET}${l7}${PRIMARY_COLOR}${V}${RESET}${r7}${PRIMARY_COLOR}${V}${RESET}`);

  // Row 8
  const l8 = padText(``, leftW);
  const r8 = padText(` • Fully responsive UI scaling.`, rightW);
  console.log(`${PRIMARY_COLOR}${V}${RESET}${l8}${PRIMARY_COLOR}${V}${RESET}${r8}${PRIMARY_COLOR}${V}${RESET}`);

  // Divider across entire box
  console.log(`${PRIMARY_COLOR}├${H.repeat(leftW)}┼${H.repeat(rightW)}┤${RESET}`);

  // Footer Row
  const fLeft = padText(`  ${DIM}openai/gpt-oss-20b • DuckDuckGo${RESET}${PRIMARY_COLOR}`, leftW);
  const fRight = padText(` ${DIM}~/Desktop/langchain${RESET}${PRIMARY_COLOR}`, rightW);
  console.log(`${PRIMARY_COLOR}${V}${RESET}${fLeft}${PRIMARY_COLOR}${V}${RESET}${fRight}${PRIMARY_COLOR}${V}${RESET}`);

  // Bottom Border
  console.log(`${PRIMARY_COLOR}╰${H.repeat(leftW)}┴${H.repeat(rightW)}╯${RESET}`);
  console.log(); // Spacing
}

module.exports = {
  printRoboBanner,
  hexToAnsi,
  PRIMARY_COLOR,
  RESET,
  BOLD
};
