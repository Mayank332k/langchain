const { askQuestion, closeTerminal } = require("../utils/helpers");
const { processUserQueryStream } = require("../services/agent_service");
const ora = require("ora");
const { printRoboBanner, PRIMARY_COLOR, RESET, BOLD } = require("../utils/ui");

async function startChatFlow() {
  printRoboBanner();
  
  while (true) {
    const input = await askQuestion(`${PRIMARY_COLOR}${BOLD}🗣️  Aap: ${RESET}`);
    
    const lowerInput = input.trim().toLowerCase();
    if (lowerInput === "exit" || lowerInput === "quit") {
      closeTerminal();
      break;
    }
    
    if (lowerInput === "") {
      continue;
    }

    console.log(); // Add gap between input and UI response

    // Start animation spinner
    const spin = ora({
      text: "Thinking...",
      color: "cyan",
      spinner: "dots"
    }).start();
    
    let isStreaming = false;

    // Hooking up event stream for status updates and text stream
    const finalAnswer = await processUserQueryStream(input, (event) => {
      if (event.type === "status") {
        spin.text = `${PRIMARY_COLOR}${event.message}${RESET}`;
      } 
      else if (event.type === "token") {
        if (!isStreaming) {
          spin.stop(); // Stop spinner when real streaming starts
          process.stdout.write(`${PRIMARY_COLOR}${BOLD}🤖 AI: ${RESET}`); // Custom colored AI prompt
          isStreaming = true;
        }
        process.stdout.write(event.token);
      }
    });
    
    if (!isStreaming) {
      // In case streaming never triggered (e.g. error)
      spin.stop();
      console.log(`${PRIMARY_COLOR}${BOLD}🤖 AI: ${RESET}${finalAnswer}`);
    }

    console.log("\n"); // Double newline after AI response
  }
}

module.exports = {
  startChatFlow
};
