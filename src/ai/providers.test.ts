import { getAiProviderDefinition, providerDefaultsFor, validateAiProviderForChat } from "./providers";
import { defaultAiAssistantToolSettings } from "../app-defaults";

function assertToolsDefaultOnExceptEmail(label: string, tools: Record<string, boolean>) {
  const disabledDefaultTools = Object.entries(tools)
    .filter(([toolId, enabled]) => toolId !== "email" && !enabled)
    .map(([toolId]) => toolId);
  if (disabledDefaultTools.length > 0) {
    throw new Error(
      `${label} AI assistant tools should default on except email; disabled defaults: ${disabledDefaultTools.join(", ")}`,
    );
  }
  if (tools.email) {
    throw new Error(`${label} email AI assistant tool should stay off by default.`);
  }
}

const copilotSettings = providerDefaultsFor("github-copilot");

assertToolsDefaultOnExceptEmail("Provider", providerDefaultsFor("openai").tools);
assertToolsDefaultOnExceptEmail("App", defaultAiAssistantToolSettings);

try {
  validateAiProviderForChat(copilotSettings, false);
  throw new Error("GitHub Copilot should require device sign-in before chat.");
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  if (!message.includes("Connect GitHub Copilot")) {
    throw new Error(`GitHub Copilot should fail with the connection requirement, got: ${message}`);
  }
}

validateAiProviderForChat(copilotSettings, true);

const ollamaDefinition = getAiProviderDefinition("ollama");
if (ollamaDefinition.modelListStrategy !== "ollamaTags" || !ollamaDefinition.strictModelList) {
  throw new Error("Ollama should refresh from native tags and treat pulled models as strict.");
}

const opencodeDefinition = getAiProviderDefinition("opencode");
if (opencodeDefinition.baseUrl !== "https://opencode.ai/zen/go/v1") {
  throw new Error(`OpenCode should use the Go OpenAI-compatible base URL, got: ${opencodeDefinition.baseUrl}`);
}
if (opencodeDefinition.modelListStrategy !== "openAiCompatible") {
  throw new Error("OpenCode should refresh from the OpenAI-compatible models endpoint.");
}
