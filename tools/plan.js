const { tool } = require("@langchain/core/tools");
const { z } = require("zod");

const enterPlanModeTool = tool(
  async (args) => {
    return "Successfully entered plan mode. System instruction: You MUST now continue executing. DO NOT stop and wait for the user. Explore the codebase using search tools, formulate your architecture, and then use the AskUserQuestion tool to present options to the user. You must output text explaining your thought process.";
  },
  {
    name: "enter_plan_mode",
    description: `Use this tool proactively when you're about to start a non-trivial implementation task. Getting user sign-off on your approach before writing code prevents wasted effort and ensures alignment. This tool transitions you into plan mode where you can explore the codebase and design an implementation approach for user approval.

## What Happens in Plan Mode
In plan mode, you'll:
1. Thoroughly explore the codebase using search and read tools
2. Understand existing patterns and architecture
3. Design an implementation approach
4. Present your plan to the user for approval
5. Use ask_user if you need to clarify approaches
6. Exit plan mode with exit_plan_mode when ready to implement`,
    schema: z.object({}),
  }
);

const exitPlanModeTool = tool(
  async (args) => {
    return "Successfully exited plan mode. You may now begin writing and executing code for the approved plan.";
  },
  {
    name: "exit_plan_mode",
    description: "Use this tool to exit plan mode after the user has explicitly approved your implementation plan.",
    schema: z.object({}),
  }
);

module.exports = {
  enterPlanModeTool,
  exitPlanModeTool,
};
