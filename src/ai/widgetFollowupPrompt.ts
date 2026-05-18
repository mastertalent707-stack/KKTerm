type WidgetFollowupMessage = {
  role: "assistant" | "user";
  content: string;
  intent?: string;
};

type WidgetDuplicateChoice = "edit" | "createNew" | "place";

export function resolveCreateWidgetFollowupPrompt(
  prompt: string,
  previousMessages: readonly WidgetFollowupMessage[],
): string {
  const choice = parseWidgetDuplicateChoice(prompt);
  if (!choice) {
    return prompt;
  }

  const choicePromptIndex = findLatestDuplicateChoicePrompt(previousMessages);
  if (choicePromptIndex < 0) {
    return prompt;
  }

  const choicePrompt = previousMessages[choicePromptIndex];
  const matchedWidgetTitle = extractDuplicateChoiceWidgetTitle(choicePrompt.content);
  const originalRequest = findOriginalCreateWidgetRequest(
    previousMessages.slice(0, choicePromptIndex),
  );

  const context = [
    "This is a follow-up to your previous duplicate-widget choices.",
    originalRequest ? `Original widget request: ${originalRequest}` : "",
    matchedWidgetTitle ? `Matched existing widget: ${matchedWidgetTitle}` : "",
  ].filter(Boolean);

  if (choice === "createNew") {
    return [
      ...context,
      "The user chose option 2, Create new.",
      "Create a separate new Dashboard widget for the original request on the active view. Do not ask the duplicate-widget choice question again for this follow-up.",
    ].join("\n");
  }

  if (choice === "place") {
    return [
      ...context,
      "The user chose option 3, Place it.",
      "Place the matched existing widget onto the active Dashboard view. Do not create a duplicate widget and do not ask the duplicate-widget choice question again for this follow-up.",
    ].join("\n");
  }

  return [
    ...context,
    "The user chose option 1, Edit existing.",
    "Edit the matched existing widget to satisfy the original request. Do not create a duplicate widget and do not ask the duplicate-widget choice question again for this follow-up.",
  ].join("\n");
}

function parseWidgetDuplicateChoice(prompt: string): WidgetDuplicateChoice | null {
  const normalized = prompt.trim().toLowerCase().replace(/\s+/g, " ");
  if (!normalized) {
    return null;
  }
  if (/^(1|edit|edit existing|modify|modify existing)$/.test(normalized)) {
    return "edit";
  }
  if (/^(2|new|create new|new one|create a new one|make new|make a new one)$/.test(normalized)) {
    return "createNew";
  }
  if (/^(3|place|place it|add it|drop it|use existing|use it)$/.test(normalized)) {
    return "place";
  }
  return null;
}

function findLatestDuplicateChoicePrompt(messages: readonly WidgetFollowupMessage[]): number {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message.role === "assistant" && isDuplicateChoicePrompt(message.content)) {
      return index;
    }
  }
  return -1;
}

function isDuplicateChoicePrompt(content: string): boolean {
  const normalized = content.toLowerCase();
  return (
    normalized.includes("edit existing") &&
    normalized.includes("create new") &&
    normalized.includes("place it") &&
    normalized.includes("reply with")
  );
}

function extractDuplicateChoiceWidgetTitle(content: string): string {
  const bulletMatch = content.match(/-\s+\*\*([^*]+)\*\*/);
  if (bulletMatch?.[1]?.trim()) {
    return bulletMatch[1].trim();
  }
  const quotedMatch = content.match(/(?:modify|drop)\s+\*\*[“"]?([^”"*]+)[”"]?\*\*/i);
  return quotedMatch?.[1]?.trim() ?? "";
}

function findOriginalCreateWidgetRequest(messages: readonly WidgetFollowupMessage[]): string {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message.role !== "user") {
      continue;
    }
    if (message.intent === "createWidget" && !parseWidgetDuplicateChoice(message.content)) {
      return message.content.trim();
    }
  }
  return "";
}
