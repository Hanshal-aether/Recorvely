import { GeminiProvider } from "./gemini";
import type {
  LlmProvider,
  DeclineClassificationInput,
  DeclineCategory,
} from "./provider";

// Known decline codes get classified instantly by this table - no API
// call, no cost, no latency, and it's the same answer every time. The LLM
// is only consulted for codes that aren't in here, which keeps both the
// Gemini bill and the "black box" surface area small.
const RULES: Record<string, DeclineCategory> = {
  insufficient_funds: "soft_decline",
  bank_temporarily_unavailable: "soft_decline",
  issuer_timeout: "soft_decline",

  card_expired: "hard_decline",
  account_closed: "hard_decline",
  card_reported_lost_or_stolen: "hard_decline",
  invalid_card: "hard_decline",

  authentication_timeout: "auth_failure",
  otp_not_entered: "auth_failure",
  three_ds_failed: "auth_failure",

  suspected_fraud: "risk_block",
  issuer_risk_block: "risk_block",
};

let cachedProvider: LlmProvider | null = null;

function getProvider(): LlmProvider {
  if (cachedProvider) return cachedProvider;

  const providerName = process.env.LLM_PROVIDER ?? "gemini";

  // This switch is the ONLY place a provider is chosen. Adding a new
  // provider means adding one case here and one file implementing
  // LlmProvider - nothing else in the codebase changes.
  switch (providerName) {
    case "gemini":
    default:
      cachedProvider = new GeminiProvider(process.env.GEMINI_API_KEY as string);
      break;
  }

  return cachedProvider;
}

export async function classifyDecline(input: DeclineClassificationInput): Promise<{
  category: DeclineCategory;
  confidence: number;
  method: "rule" | "llm";
  reasoning: string;
}> {
  const ruleMatch = RULES[input.declineCode];
  if (ruleMatch) {
    return {
      category: ruleMatch,
      confidence: 1,
      method: "rule",
      reasoning: `Matched known decline code "${input.declineCode}".`,
    };
  }

  const provider = getProvider();
  const result = await provider.classifyDecline(input);
  return {
    category: result.category,
    confidence: result.confidence,
    method: "llm",
    reasoning: result.reasoning,
  };
}
