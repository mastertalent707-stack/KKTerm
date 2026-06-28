import { STANDARD_REASONING_EFFORTS } from "./shared";
import type { AiProviderDefinition } from "./types";

// Vanilla local Ollama (http://localhost:11434) needs no auth, so the API key
// stays optional. But the base URL is user-configurable, and people routinely
// point this provider at a remote/self-hosted Ollama placed behind an
// authenticating reverse proxy (nginx/Caddy bearer, OpenWebUI keys, etc.). The
// optional key rides as `Authorization: Bearer` only when filled, and the extra
// headers field covers proxies that expect an arbitrary custom header instead.
export const ollamaProvider: AiProviderDefinition = {
  kind: "ollama",
  label: "Ollama",
  baseUrl: "http://localhost:11434/v1",
  defaultModel: "qwen3",
  defaultReasoningEffort: "default",
  reasoningEfforts: [...STANDARD_REASONING_EFFORTS],
  requiresApiKey: false,
  allowsCustomBaseUrl: true,
  allowsCustomModel: true,
  apiKeyLabel: "Ollama API key (optional, for authenticating proxies)",
  modelListStrategy: "ollamaTags",
  strictModelList: true,
  modelOptions: [
    { id: "qwen3", label: "Qwen3", note: "Local general use", supportsImageInput: false },
    { id: "gpt-oss", label: "gpt-oss", note: "Open-weight", supportsImageInput: false },
    { id: "deepseek-r1", label: "DeepSeek-R1", note: "Local reasoning", supportsImageInput: false },
    { id: "gemma3", label: "Gemma 3", supportsImageInput: true },
  ],
  settingsFields: ["baseUrl", "model", "reasoningEffort", "apiKey", "extraHeaders"],
  capabilities: ["chat", "imageInput", "streaming", "toolCalling", "localRuntime", "openAiCompatible"],
};
