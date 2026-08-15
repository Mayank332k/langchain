const readline = require('readline');

// Terminal me clean output aur input ke liye helper functions.
// Readline interface setup karte hain.

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Terminal se user ka input lene ke liye Promise-based helper.
 * @param {string} question - Question to ask the user.
 * @returns {Promise<string>}
 */
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

/**
 * Application band karne ka function
 */
function closeTerminal() {
  console.log("👋 Alvida! AI Assistant band ho raha hai.");
  rl.close();
  process.exit(0);
}

module.exports = {
  askQuestion,
  closeTerminal
};
