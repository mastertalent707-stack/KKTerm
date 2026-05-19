import { AiCodingUsageWidget } from "../../ai-coding-usage/AiCodingUsageWidget";
import type { BuiltInWidgetBodyProps } from "../registry/builtInRegistry";

export function AiCodingUsageBody({ instance }: BuiltInWidgetBodyProps) {
  return <AiCodingUsageWidget instanceId={instance.id} />;
}
