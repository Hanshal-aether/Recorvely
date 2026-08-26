/**
 * Every LLM provider (Gemini, Claude, anything else) implements this one
 * method. Nothing else in the codebase is allowed to import a provider SDK
 * directly - everything goes through classifyDecline() in classifier.ts,
 * which picks the provider based on LLM_PROVIDER in the environment.
 *
 * Why this matters: the only data this function receives is the decline
 * code, the decline message, and the amount - no customer name, no card
 * details, no PII. That's a deliberate minimization, not an accident, and
 * it holds regardless of which provider is plugged in behind it.
 */
export type DeclineClassificationInput = {
  declineCode: string;
  declineMessage: string;
  amountPaise: number;
  attemptNumber: number;
};

export type DeclineCategory =
  | "soft_decline"
  | "hard_decline"
  | "auth_failure"
  | "risk_block"
  | "unknown";

export type DeclineClassificationResult = {
  category: DeclineCategory;
  confidence: number; // 0-1
  reasoning: string;
};

export interface LlmProvider {
  classifyDecline(
    input: DeclineClassificationInput
  ): Promise<DeclineClassificationResult>;
}
