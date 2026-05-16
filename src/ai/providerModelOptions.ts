import type { AiProviderKind } from "../types";

type ProviderModelOption = {
  id: string;
  label: string;
};

const OPENROUTER_MODEL_COLLATOR = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});

function compareOpenRouterModelsDescending(
  left: ProviderModelOption,
  right: ProviderModelOption,
) {
  const byId = OPENROUTER_MODEL_COLLATOR.compare(right.id, left.id);
  if (byId !== 0) return byId;
  return OPENROUTER_MODEL_COLLATOR.compare(right.label, left.label);
}

export function sortModelOptionsForProvider<T extends ProviderModelOption>(
  providerKind: AiProviderKind,
  models: T[],
) {
  if (providerKind !== "openrouter") return models;
  return [...models].sort(compareOpenRouterModelsDescending);
}
