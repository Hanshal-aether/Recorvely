import type { DeclineCategory } from "../llm/provider";

export type PolicyAction =
  | "retry_now"
  | "retry_scheduled"
  | "escalate_update_method"
  | "escalate_review"
  | "stop";

export type PolicyDecisionResult = {
  action: PolicyAction;
  scheduledFor?: Date;
  reason: string;
};

const MAX_RETRY_ATTEMPTS = Number(process.env.MAX_RETRY_ATTEMPTS ?? 3);

/**
 * The core judgment call of the whole system. Given a classified failure
 * and how many times it's already been tried, decide what to do next -
 * and, critically, when to stop instead of retrying forever.
 *
 * This is deliberately NOT "if failed, retry" for every category. Blind
 * retries on a hard decline (closed account, stolen card) waste attempts
 * and can get a merchant's retry privileges throttled by the card network
 * for looking like abuse - so hard declines and risk blocks never retry
 * automatically, regardless of attempt count.
 */
export function decidePolicy(params: {
  category: DeclineCategory;
  attemptNumber: number;
}): PolicyDecisionResult {
  const { category, attemptNumber } = params;

  if (attemptNumber > MAX_RETRY_ATTEMPTS) {
    return {
      action: "stop",
      reason: `Reached max retry attempts (${MAX_RETRY_ATTEMPTS}) without recovery. Stopping rather than retrying indefinitely.`,
    };
  }

  switch (category) {
    case "soft_decline": {
      // Retry later rather than immediately - a card that was declined
      // for insufficient funds ten seconds ago is unlikely to succeed if
      // retried ten seconds later. Spacing retries by a day gives a real
      // chance for balance/limit conditions to change.
      const scheduledFor = new Date(Date.now() + 24 * 60 * 60 * 1000);
      return {
        action: "retry_scheduled",
        scheduledFor,
        reason:
          "Soft decline (likely temporary). Scheduling a retry in 24h instead of retrying immediately or not at all.",
      };
    }

    case "hard_decline": {
      return {
        action: "escalate_update_method",
        reason:
          "Hard decline (e.g. expired/closed card). Retrying would not succeed and risks issuer scrutiny - asking the customer to update their payment method instead.",
      };
    }

    case "auth_failure": {
      if (attemptNumber === 1) {
        return {
          action: "retry_now",
          reason:
            "Authentication step failed on first attempt (e.g. 3DS timeout). Retrying once immediately with a fresh auth flow.",
        };
      }
      return {
        action: "escalate_update_method",
        reason:
          "Authentication failed more than once. Not retrying blindly again - asking the customer to re-authenticate directly instead.",
      };
    }

    case "risk_block": {
      return {
        action: "escalate_review",
        reason:
          "Issuer flagged this as suspected fraud. Never auto-retried - routed to human review regardless of attempt count.",
      };
    }

    case "unknown":
    default: {
      return {
        action: "escalate_review",
        reason:
          "Classifier could not confidently categorize this decline. Routed to human review rather than guessing.",
      };
    }
  }
}
