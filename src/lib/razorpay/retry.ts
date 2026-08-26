import { razorpay } from "./client";

export type RetryResult = {
  success: boolean;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  failureReason?: string;
  amountRecoveredPaise?: number;
  simulated: boolean; // true for the part of this result that isn't a real API response
};

/**
 * IMPORTANT - be honest about this in the demo:
 *
 * Creating the Razorpay Order below is a REAL API call against Razorpay's
 * test-mode environment - it proves the integration point actually works.
 *
 * Whether the retried payment then SUCCEEDS is something only a real card
 * entered by a real customer at checkout can determine - that step can't
 * be fully automated server-side for a batch of synthetic transactions.
 * So the completion outcome here is simulated with a probability that's
 * informed by the decline category (soft declines recover more often than
 * auth failures, for example). Every result is tagged `simulated: true`
 * so this is never presented as more real than it is.
 *
 * Roadmap note: in a production version, this would hook into Razorpay's
 * saved-card / recurring-payment charge API so retries can complete
 * without the customer re-entering card details.
 */
export async function attemptRetry(params: {
  transactionId: string;
  amountPaise: number;
  category: string;
}): Promise<RetryResult> {
  let order;
  try {
    order = await razorpay.orders.create({
      amount: params.amountPaise,
      currency: "INR",
      receipt: `retry_${params.transactionId}`,
      notes: { transactionId: params.transactionId, category: params.category },
    });
  } catch (err: any) {
    return {
      success: false,
      failureReason: `Razorpay order creation failed: ${err?.message ?? "unknown error"}`,
      simulated: false,
    };
  }

  const successProbability = recoveryProbability(params.category);
  const succeeded = Math.random() < successProbability;

  return {
    success: succeeded,
    razorpayOrderId: order.id,
    razorpayPaymentId: succeeded ? `pay_sim_${order.id}` : undefined,
    failureReason: succeeded ? undefined : "Simulated: customer payment not completed",
    amountRecoveredPaise: succeeded ? params.amountPaise : undefined,
    simulated: true,
  };
}

function recoveryProbability(category: string): number {
  switch (category) {
    case "soft_decline":
      return 0.55;
    case "auth_failure":
      return 0.65;
    default:
      return 0.1;
  }
}
