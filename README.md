# Kea 🦜

> A highly intelligent, fast, and helpful terminal-based AI coding assistant.

**Note:** Kea is currently in **Beta** and is in its early stages of development. Expect rapid changes, new features, and occasional bugs!

## 🌟 Features
- **Terminal Native UI:** Clean, minimalist aesthetic built with React Ink, inspired by Claude Code CLI.
- **Agentic Code Search:** Search your codebase intelligently by file name or content using `find` and `grep` under the hood.
- **Web Search:** Integrated DuckDuckGo search to fetch real-time information from the web.
- **File System Tools:** Easily read files (`read_file`) and explore directories (`list_directory`) directly from the chat.
- **Fast & Responsive:** High-frequency streaming with an interval buffer (100-120ms) ensures a smooth, flicker-free UI.
- **Graceful Error Handling:** Robust fallbacks for LLM stream errors and tool errors.
- **Abort Capabilities:** Simply press `ESC` to abort ongoing streams safely.

## 🛠️ Tech Stack
- **Runtime:** Node.js
- **Terminal UI:** React Ink
- **AI/Agent Logic:** LangChain & LangGraph

## 🔄 How it Works (Flow)
1. **User Input:** You enter a prompt or query in the terminal.
2. **Agent Processing:** Kea's LangGraph agent processes your request, determining if it needs to use external tools.
3. **Tool Execution:** If needed, Kea dynamically calls tools like `read_file`, `search_files`, `list_directory`, or `web_search`. Dynamic animated status messages keep you informed of what Kea is doing.
4. **Streaming Response:** The AI generates a response and streams it back to the terminal, utilizing an interval buffer to maintain UI stability.
5. **Display:** The response is presented in a beautiful, minimal terminal UI.

## 🚀 Installation & Usage

### Prerequisites
- [Node.js](https://nodejs.org/) installed on your machine.

### Setup
1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd KEA
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Link the package globally (so you can use the `kea` command anywhere):
   ```bash
   npm link
   ```
4. Run Kea:
   ```bash
   kea
   ```

## 👨‍💻 Developer
Developed by **Mayank Singh**.
