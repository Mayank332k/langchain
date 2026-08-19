const { DynamicStructuredTool } = require("@langchain/core/tools");
const { z } = require("zod");

const askUserQuestionTool = new DynamicStructuredTool({
  name: "AskUserQuestion",
  description: `Use this tool only when you are blocked on a decision that is genuinely the user's to make: one you cannot resolve from the request, the code, or sensible defaults.

Usage notes:
- Users will always be able to select "Other" to provide custom text input
- Use multiSelect: true to allow multiple answers to be selected for a question
- If you recommend a specific option, make that the first option in the list and add "(Recommended)" at the end of the label

Plan mode note: To switch into plan mode, use EnterPlanMode (not this tool). Once in plan mode, use this tool to clarify requirements or choose between approaches BEFORE finalizing your plan. Do NOT use this tool to ask "Is my plan ready?", "Should I proceed?", or otherwise reference "the plan" in questions — the user cannot see the plan until you call ExitPlanMode for approval.

Reserve this for decisions where the user's answer changes what you do next — not for choices with a conventional default or facts you can verify in the codebase yourself. In those cases pick the obvious option, mention it in your response, and proceed.

Preview feature:
Use the optional \`preview\` field on options when presenting concrete artifacts that users need to visually compare:
- ASCII mockups of UI layouts or components
- Code snippets showing different implementations
- Diagram variations
- Configuration examples

Preview content is rendered as markdown in a monospace box. Multi-line text with newlines is supported. When any option has a preview, the UI switches to a side-by-side layout with a vertical option list on the left and preview on the right. Do not use previews for simple preference questions where labels and descriptions suffice. Note: previews are only supported for single-select questions (not multiSelect).`,
  schema: z.object({
    questions: z.array(z.object({
      question: z.string().describe('The complete question to ask the user. Should be clear, specific, and end with a question mark. Example: "Which library should we use for date formatting?" If multiSelect is true, phrase it accordingly, e.g. "Which features do you want to enable?"'),
      header: z.string().describe('Very short label displayed as a chip/tag (max 12 chars). Examples: "Auth method", "Library", "Approach".'),
      options: z.array(z.object({
        label: z.string().describe('The display text for this option that the user will see and select. Should be concise (1-5 words) and clearly describe the choice.'),
        description: z.string().describe('Explanation of what this option means or what will happen if chosen. Useful for providing context about trade-offs or implications.'),
        preview: z.string().optional().describe('Optional preview content rendered when this option is focused. Use for mockups, code snippets, or visual comparisons that help users compare options. See the tool description for the expected content format.')
      })).min(2).max(4).describe("The available choices for this question. Must have 2-4 options. Each option should be a distinct, mutually exclusive choice (unless multiSelect is enabled). There should be no 'Other' option, that will be provided automatically."),
      multiSelect: z.boolean().default(false).describe('Set to true to allow the user to select multiple options instead of just one. Use when choices are not mutually exclusive.')
    })).min(1).max(4).describe("Questions to ask the user (1-4 questions)"),
    answers: z.record(z.string()).optional().describe("User answers collected by the permission component"),
    annotations: z.record(z.object({
      preview: z.string().optional().describe("The preview content of the selected option, if the question used previews."),
      notes: z.string().optional().describe("Free-text notes the user added to their selection.")
    })).optional().describe("Optional per-question annotations from the user (e.g., notes on preview selections). Keyed by question text."),
    metadata: z.object({
      source: z.string().optional().describe('Optional identifier for the source of this question (e.g., "remember" for /remember command). Used for analytics tracking.')
    }).optional().describe("Optional metadata for tracking and analytics purposes. Not displayed to user.")
  }),
  func: async (args) => {
    // For now, since KEA's interactive TUI modal isn't fully built yet,
    // we format the options nicely into the chat and instruct the user to reply.
    let promptText = "I need your input on the following:\n\n";
    
    args.questions.forEach((q, i) => {
      promptText += `${i + 1}. ${q.question} [${q.header}]\n`;
      if (q.multiSelect) promptText += "(Select all that apply)\n";
      q.options.forEach((opt, j) => {
        promptText += `   ${String.fromCharCode(65 + j)}. ${opt.label} - ${opt.description}\n`;
      });
      promptText += `   ${String.fromCharCode(65 + q.options.length)}. Other (Please specify)\n\n`;
    });
    
    promptText += "Please reply in the chat with your choices (e.g., '1A', '2B', or your custom answer).";
    
    return promptText;
  }
});

module.exports = {
  askUserQuestionTool
};
