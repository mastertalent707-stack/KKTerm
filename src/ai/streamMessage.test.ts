import {
  completeAssistantStreamMessageFromResponse,
  type AssistantStreamMessage,
} from "./streamMessage.ts";

const secretRequest = [
  "```kkterm-secret-request",
  JSON.stringify({
    kind: "widgetSecret",
    ownerId: "dashboard-widget-secret:inst-1:apiKey",
    label: "API key",
  }),
  "```",
].join("\n");

const streamingMessage: AssistantStreamMessage = {
  content: `Working...\n\n${secretRequest}`,
};

const completed = completeAssistantStreamMessageFromResponse(streamingMessage, {
  providerKind: "openai",
  model: "test",
  content: "Secret entry requested.",
});

if (!completed.content.includes("Secret entry requested.")) {
  throw new Error("Final assistant content should be preserved.");
}

if (!completed.content.includes(secretRequest)) {
  throw new Error("Secret request directives emitted during streaming must survive finalization.");
}
