const React = require("react");
const { Box, useApp, Text } = require("ink");
const Header = require("./Header");
const Footer = require("./Footer");
const ChatArea = require("./ChatArea");
const InputArea = require("./InputArea");
const useTerminalSize = require("../hooks/useTerminalSize");
const useAgent = require("../hooks/useAgent");
const Settings = require("./Settings");
const PermissionPrompt = require("./PermissionPrompt");

const Divider = ({ columns }) => (
  <Box width="100%" flexDirection="column" paddingX={0} marginY={0}>
    <Text dimColor wrap="truncate">{'─'.repeat(Math.max(0, (columns || 80) - 1))}</Text>
  </Box>
);

function MainLayout() {
  const size = useTerminalSize();
  const agent = useAgent();



  return (
    <Box flexDirection="column" paddingX={0} paddingBottom={0} width="100%">
      <Box paddingX={1} paddingBottom={1}>
        <Header
          modelName={agent.getAgentSettings().model || "Model"}
          isThinking={agent.getAgentSettings().thinking !== false}
          worker={process.cwd()}
        />
      </Box>

      <ChatArea
        messages={agent.messages}
        streamingContent={agent.streamingContent}
        reasoningContent={agent.reasoningContent}
        status={agent.status}
        showThinking={agent.getAgentSettings().showThinking !== false}
      />
      
      <Divider columns={size.columns} />

      <Box paddingX={1}>
        {agent.view === "settings" ? (
          <Settings onClose={() => agent.setView("chat")} />
        ) : agent.pendingPermission ? (
          <PermissionPrompt 
            pendingPermission={{
              ...agent.pendingPermission,
              callback: (approved) => {
                agent.pendingPermission.resolve(approved);
                agent.setPendingPermission(null);
              }
            }} 
          />
        ) : (
          <InputArea
            onSubmit={agent.handleSubmit}
            isProcessing={agent.isProcessing}
            isPlanning={agent.isPlanning}
          />
        )}
      </Box>

      <Divider columns={size.columns} />

      <Box paddingX={1} paddingTop={0} paddingBottom={1}>
        <Footer
          modelName={agent.getAgentSettings().model || "Model"}
        />
      </Box>
    </Box>
  );
}

module.exports = MainLayout;
