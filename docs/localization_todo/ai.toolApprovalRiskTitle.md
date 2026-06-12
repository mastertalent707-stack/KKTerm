# ai.toolApprovalRiskTitle

- **English value**: `Flagged as risky`
- **Namespace**: `ai`
- **File/component**: `src/ai/AssistantToolApprovalCards.tsx`
- **UI role**: `heading`
- **User flow**: On the in-chat tool approval card, when the assistant's proposed command matches KKTerm's risky-command heuristic (destructive, service-disrupting, or credential-touching), this heads a red warning block listing the reasons before the user chooses allow/deny.
- **Tone**: concise/neutral caution, short phrase
- **Placeholders**: none
- **Context/meaning**: "risky" = potentially destructive or sensitive command flagged by a best-effort keyword check, not a confirmed threat. The reason lines under this heading are backend-generated English text and are not translated.
- **Domain notes**: Appears alongside the existing `ai.toolApproval*` approval-card keys; "tool" here is an AI Assistant tool call, not a Settings tool toggle.

<!--
Filename: ai.toolApprovalRiskTitle.md
Delete this file once every non-English locale under src/i18n/locales/ has the key translated.
-->
