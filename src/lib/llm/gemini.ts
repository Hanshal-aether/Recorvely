import { GoogleGenerativeAI } from "@google/generative-ai";
import type {
  LlmProvider,
  DeclineClassificationInput,
  DeclineClassificationResult,
  DeclineCategory,
} from "./provider";

const VALID_CATEGORIES: DeclineCategory[] = [
  "soft_decline",
  "hard_decline",
  "auth_failure",
  "risk_block",
  "unknown",
];

export class GeminiProvider implements LlmProvider {
  private client: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.client = new GoogleGenerativeAI(apiKey);
  }

  async classifyDecline(
    input: DeclineClassificationInput
  ): Promise<DeclineClassificationResult> {
    const model = this.client.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" },
    });

    // Only the minimal fields needed to classify are sent - no customer
    // name, no card number, no PII of any kind.
    const prompt = `You classify a payment decline into exactly one category.

Categories:
- soft_decline: temporary issue, safe to retry later (e.g. insufficient funds, temporary bank error)
- hard_decline: permanent issue, never blind-retry (e.g. expired card, closed account, stolen card)
- auth_failure: authentication step failed (e.g. 3DS timeout, OTP not entered)
- risk_block: issuer flagged this as suspected fraud, must go to human review, never retry automatically
- unknown: you cannot confidently pick one of the above

Decline code: ${input.declineCode}
Decline message: ${input.declineMessage}
Amount (paise): ${input.amountPaise}
Attempt number so far: ${input.attemptNumber}

Respond ONLY with JSON in this exact shape, no markdown fences:
{"category": "<one of the five categories above>", "confidence": <number 0 to 1>, "reasoning": "<one short sentence>"}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    try {
      const parsed = JSON.parse(text);
      const category: DeclineCategory = VALID_CATEGORIES.includes(
        parsed.category
      )
        ? parsed.category
        : "unknown";
      return {
        category,
        confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.5,
        reasoning: parsed.reasoning ?? "No reasoning provided by model.",
      };
    } catch {
      // If the model returns something unparseable, fail safe into
      // "unknown" rather than crashing the worker or guessing.
      return {
        category: "unknown",
        confidence: 0,
        reasoning: "Model response was not valid JSON; defaulted to unknown.",
      };
    }
  }
}
