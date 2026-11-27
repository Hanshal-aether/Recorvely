"""Bootstrap training data for the Recoverly decline classifier.

IMPORTANT: this is NOT real merchant data. It is a hand-built taxonomy of
decline codes/messages as they appear across Razorpay, Stripe, PayPal and
card-network style responses, labelled from domain knowledge. Its job is to
bootstrap the pipeline. Replace/extend it with real labelled declines as
merchants connect (see ml/README.md).
"""
import csv, random, re, sys

random.seed(7)

# category -> list of (code variants, message variants)
T = {
 "soft_decline": [
  (["insufficient_funds", "INSUFFICIENT_FUNDS", "insufficient_balance"], ["Insufficient funds in account", "Your account has insufficient funds to cover this payment", "Not enough balance available", "Payment declined due to low balance"]),
  (["bank_temporarily_unavailable", "issuer_unavailable", "processing_error"], ["Bank system temporarily unavailable", "Issuer is currently unavailable, try again later", "Temporary processing error at the bank", "The bank could not process the request right now"]),
  (["issuer_timeout", "gateway_timeout", "try_again_later"], ["Issuer did not respond in time", "The request timed out, please try again", "Gateway timeout while contacting the bank", "No response from issuing bank"]),
  (["withdrawal_count_limit_exceeded", "daily_limit_exceeded", "amount_limit_exceeded"], ["Daily transaction limit exceeded", "Card limit exceeded for today", "Withdrawal count limit exceeded", "Transaction amount exceeds the permitted limit"]),
  (["do_not_honor", "generic_decline", "card_declined"], ["Do not honor", "The card was declined, no reason given", "Transaction declined by the issuer", "Generic decline from bank"]),
  (["network_error", "connection_failed"], ["Network error while processing payment", "Connection to payment network failed", "Temporary network failure"]),
 ],
 "hard_decline": [
  (["card_expired", "expired_card", "EXPIRED_CARD"], ["Card has expired", "Your card is expired", "The card expiry date has passed", "Expired card, ask customer to update"]),
  (["account_closed", "closed_account"], ["Account is closed", "The customer's bank account has been closed", "This account is no longer active"]),
  (["card_reported_lost_or_stolen", "lost_card", "stolen_card", "pickup_card"], ["Card reported lost or stolen", "The card has been reported lost", "Stolen card, do not retry", "Pick up card"]),
  (["invalid_card", "invalid_card_number", "incorrect_number", "invalid_account"], ["Invalid card number", "The card number is incorrect", "Card number does not exist", "Invalid account number"]),
  (["card_not_supported", "restricted_card", "transaction_not_allowed"], ["Card not supported for this transaction", "Restricted card", "This card type is not allowed for recurring payments", "Transaction not permitted to cardholder"]),
  (["mandate_revoked", "mandate_cancelled", "standing_instruction_cancelled"], ["Customer has revoked the mandate", "The recurring mandate was cancelled by the customer", "Standing instruction no longer valid"]),
 ],
 "auth_failure": [
  (["authentication_timeout", "authentication_required", "3ds_timeout"], ["3DS authentication timed out", "Customer authentication is required", "Authentication was not completed in time"]),
  (["otp_not_entered", "otp_expired", "incorrect_otp", "invalid_otp"], ["OTP not entered in time", "The one time password has expired", "Customer entered an incorrect OTP", "OTP verification failed"]),
  (["three_ds_failed", "authentication_failed", "3ds_failed"], ["3DS authentication failed", "Cardholder authentication failed", "Authentication declined by issuer"]),
  (["incorrect_cvc", "invalid_cvv", "cvv_mismatch"], ["The card security code is incorrect", "CVV verification failed", "Invalid CVV entered"]),
  (["upi_collect_expired", "upi_pin_incorrect", "upi_mandate_not_approved"], ["The UPI request expired before approval", "Customer entered an incorrect UPI PIN", "UPI mandate was not approved by the customer"]),
 ],
 "risk_block": [
  (["suspected_fraud", "fraudulent", "fraud_suspected"], ["Issuer flagged transaction as suspected fraud", "Payment blocked as potentially fraudulent", "Fraud check failed"]),
  (["issuer_risk_block", "risk_threshold_exceeded", "high_risk"], ["Blocked by issuer risk controls", "Risk threshold exceeded for this payment", "The transaction was declined by the risk engine"]),
  (["security_violation", "stop_payment_order", "blocked_by_merchant_rules"], ["Security violation detected", "Customer placed a stop payment order", "Blocked by fraud rules"]),
 ],
}

def noise(s):
    r = random.random()
    if r < .15: s = s.lower()
    elif r < .25: s = s.upper()
    if random.random() < .15: s = re.sub(r"[.,]", "", s)
    if random.random() < .10: s = s + "."
    if random.random() < .08 and len(s) > 8:
        i = random.randrange(1, len(s) - 2); s = s[:i] + s[i+1:]
    return s

rows = []
tid = 0
for cat, templates in T.items():
    for codes, msgs in templates:
        tid += 1
        for _ in range(40):
            rows.append({
                "template": tid, "decline_code": noise(random.choice(codes)),
                "decline_message": noise(random.choice(msgs)), "label": cat,
            })
random.shuffle(rows)
out = sys.argv[1] if len(sys.argv) > 1 else "ml/data/bootstrap.csv"
import os; os.makedirs(os.path.dirname(out), exist_ok=True)
with open(out, "w", newline="") as f:
    w = csv.DictWriter(f, fieldnames=["template", "decline_code", "decline_message", "label"])
    w.writeheader(); w.writerows(rows)
print(f"wrote {len(rows)} rows, {tid} templates -> {out}")
