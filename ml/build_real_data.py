"""Builds ml/data/real/*.csv from public payment-processor documentation.

Sources (public docs, copied as plain facts; re-check them when refreshing):
  * Braintree/PayPal authorization responses - code, text and an official
    Soft/Hard type for each decline:
    https://developer.paypal.com/braintree/docs/reference/general/processor-responses/authorization-responses
  * Stripe "network decline codes" - raw Visa / Mastercard / Amex / Discover
    codes with explanations (no retry label):
    https://docs.stripe.com/declines/network-codes
  * Mastercard Merchant Advice Codes: MAC 01 = new account info needed,
    MAC 02 = try again later, MAC 03 = do not try again.

LABEL QUALITY (important):
  label_source = braintree_type   -> label comes from Braintree's own Soft/Hard type
  label_source = mastercard_mac   -> label comes from Mastercard's official retry advice
  label_source = override         -> our 5-class taxonomy differs from Soft/Hard (e.g. merchant
                                     set-up errors become 'unknown' so a human reviews them)
  label_source = draft            -> assigned by judgement. REVIEW THESE before trusting them.
"""
import csv, os

OUT = "ml/data/real"
os.makedirs(OUT, exist_ok=True)

BRAINTREE = """2000|Do Not Honor|Soft
2001|Insufficient Funds|Soft
2002|Limit Exceeded|Soft
2003|Cardholder's Activity Limit Exceeded|Soft
2004|Expired Card|Hard
2005|Invalid Credit Card Number|Hard
2006|Invalid Expiration Date|Hard
2007|No Account|Hard
2008|Card Account Length Error|Hard
2009|No Such Issuer|Hard
2010|Card Issuer Declined CVV|Hard
2011|Voice Authorization Required|Hard
2012|Processor Declined – Possible Lost Card|Hard
2013|Processor Declined – Possible Stolen Card|Hard
2014|Processor Declined – Fraud Suspected|Hard
2015|Transaction Not Allowed|Hard
2016|Duplicate Transaction|Soft
2017|Cardholder Stopped Billing|Hard
2018|Cardholder Stopped All Billing|Hard
2019|Invalid Transaction|Hard
2020|Violation|Hard
2021|Security Violation|Hard
2022|Declined – Updated Cardholder Available|Hard
2023|Processor Does Not Support This Feature|Hard
2024|Card Type Not Enabled|Hard
2025|Set Up Error – Merchant|Soft
2026|Invalid Merchant ID|Soft
2027|Set Up Error – Amount|Hard
2028|Set Up Error – Hierarchy|Hard
2029|Set Up Error – Card|Hard
2030|Set Up Error – Terminal|Hard
2031|Encryption Error|Hard
2032|Surcharge Not Permitted|Hard
2033|Inconsistent Data|Hard
2034|No Action Taken|Soft
2035|Partial Approval For Amount In Group III Version|Soft
2036|Authorization could not be found|Hard
2037|Already Reversed|Hard
2038|Processor Declined|Soft
2039|Invalid Authorization Code|Hard
2040|Invalid Store|Soft
2041|Declined – Call For Approval|Hard
2042|Invalid Client ID|Soft
2043|Error – Do Not Retry, Call Issuer|Hard
2044|Declined – Call Issuer|Hard
2045|Invalid Merchant Number|Hard
2046|Declined|Soft
2047|Call Issuer. Pick Up Card|Hard
2048|Invalid Amount|Soft
2049|Invalid SKU Number|Hard
2050|Invalid Credit Plan|Hard
2051|Credit Card Number does not match method of payment|Hard
2052|Invalid level III Purchase|Hard
2053|Card reported as lost or stolen|Hard
2054|Reversal amount does not match authorization amount|Hard
2055|Invalid Transaction Division Number|Hard
2056|Transaction amount exceeds the transaction division limit|Hard
2057|Issuer or Cardholder has put a restriction on the card|Soft
2058|Merchant not Mastercard SecureCode enabled|Hard
2059|Address Verification Failed|Hard
2060|Address Verification and Card Security Code Failed|Hard
2061|Invalid Transaction Data|Hard
2062|Invalid Tax Amount|Soft
2063|PayPal Business Account preference resulted in the transaction failing|Hard
2064|Invalid Currency Code|Hard
2065|Refund Time Limit Exceeded|Hard
2066|PayPal Business Account Restricted|Hard
2067|Authorization Expired|Hard
2068|PayPal Business Account Locked or Closed|Hard
2069|PayPal Blocking Duplicate Order IDs|Hard
2070|PayPal Buyer Revoked Pre-Approved Payment Authorization|Hard
2071|PayPal Payee Account Invalid Or Does Not Have a Confirmed Email|Hard
2072|PayPal Payee Email Incorrectly Formatted|Hard
2073|PayPal Validation Error|Hard
2074|Funding Instrument In The PayPal Account Was Declined By The Processor Or Bank, Or It Can't Be Used For This Payment|Hard
2075|Payer Account Is Locked Or Closed|Hard
2076|Payer Cannot Pay For This Transaction With PayPal|Hard
2077|Transaction Refused Due To PayPal Risk Model|Hard
2078|Invalid Secure Payment Data|Soft
2079|PayPal Merchant Account Configuration Error|Hard
2080|Invalid user credentials|Soft
2081|PayPal pending payments are not supported|Hard
2082|PayPal Domestic Transaction Required|Hard
2083|PayPal Phone Number Required|Hard
2084|PayPal Tax Info Required|Hard
2085|PayPal Payee Blocked Transaction|Hard
2086|PayPal Transaction Limit Exceeded|Hard
2087|PayPal reference transactions not enabled for your account|Hard
2088|Currency not enabled for your PayPal seller account|Hard
2089|PayPal payee email permission denied for this request|Hard
2090|PayPal or Venmo account not configured to refund more than settled amount|Hard
2091|Currency of this transaction must match currency of your PayPal account|Hard
2092|No Data Found - Try Another Verification Method|Soft
2093|PayPal payment method is invalid|Hard
2094|PayPal payment has already been completed|Hard
2095|PayPal refund is not allowed after partial refund|Hard
2096|PayPal buyer account can't be the same as the seller account|Hard
2097|PayPal authorization amount limit exceeded|Hard
2098|PayPal authorization count limit exceeded|Hard
2099|Cardholder Authentication Required|Soft
2100|PayPal channel initiated billing not enabled for your account|Hard
2101|Additional authorization required|Soft
2102|Incorrect PIN|Soft
2103|PIN try exceeded|Soft
2104|Offline Issuer Declined|Soft
2105|Cannot Authorize at this time (Life cycle)|Soft
2106|Cannot Authorize at this time (Policy)|Soft
2107|Card Not Activated|Hard
2108|Closed Card|Hard
3000|Processor Network Unavailable – Try Again|Soft"""

# Our taxonomy has 5 classes, Braintree has 2. These code sets move a row out of Soft/Hard.
RISK = {2014, 2020, 2021, 2077}
AUTH = {2010, 2059, 2060, 2092, 2099, 2101, 2102, 2103}
# Merchant set-up, integration, duplicate and payer-side account errors: retrying
# will not help and neither will asking the customer for a new card -> human review.
UNKNOWN = {2011, 2015, 2016, 2019, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033,
           2034, 2035, 2036, 2037, 2038, 2039, 2040, 2041, 2042, 2044, 2045, 2046, 2048, 2049, 2050,
           2051, 2052, 2054, 2055, 2056, 2058, 2061, 2062, 2063, 2064, 2065, 2066, 2067, 2068, 2069,
           2071, 2072, 2073, 2078, 2079, 2080, 2081, 2082, 2083, 2084, 2085, 2087, 2088, 2089, 2090,
           2091, 2093, 2094, 2095, 2096, 2097, 2098, 2100, 2104}

rows = []
for line in BRAINTREE.splitlines():
    code, text, typ = line.split("|")
    c = int(code)
    if c in RISK: lab, src = "risk_block", "override"
    elif c in AUTH: lab, src = "auth_failure", "override"
    elif c in UNKNOWN: lab, src = "unknown", "override"
    else: lab, src = ("soft_decline" if typ == "Soft" else "hard_decline"), "braintree_type"
    rows.append(dict(family=f"braintree:{code}", decline_code=code, decline_message=text, label=lab, label_source=src))

# ---- card network codes (Stripe docs) ----
S, H, A, R, U = "soft_decline", "hard_decline", "auth_failure", "risk_block", "unknown"
NETWORK = [
 # Visa
 ("visa","01","Refer to card issuer.",U),("visa","02","Refer to card issuer, special condition.",U),
 ("visa","03","Invalid merchant.",U),("visa","04","Pick up card (no fraud).",H),("visa","05","Don't honour.",S),
 ("visa","06","Error.",S),("visa","07","Pick up card, special condition (fraud account).",R),
 ("visa","12","Invalid transaction.",U),("visa","13","Invalid amount or currency conversion field overflow.",U),
 ("visa","14","Invalid account number (no such number).",H),("visa","15","No such issuer.",H),
 ("visa","19","Re-enter transaction.",S),("visa","21","No action taken.",U),("visa","25","Unable to locate record in file.",U),
 ("visa","28","File temporarily not available for update or enquiry.",S),("visa","39","No credit account.",H),
 ("visa","41","Lost card, pick up (fraud account).",H),("visa","43","Stolen card, pick up (fraud account).",H),
 ("visa","46","Closed account.",H),("visa","51","Not sufficient funds.",S),("visa","52","No checking account.",H),
 ("visa","53","No savings account.",H),("visa","54","Expired card or expiry date is missing.",H),
 ("visa","55","Incorrect PIN or PIN missing.",A),("visa","57","Transaction not permitted to cardholder.",H),
 ("visa","58","Transaction not allowed at terminal.",U),("visa","59","Suspected fraud.",R),
 ("visa","61","Exceeds approval amount limit.",S),("visa","62","Restricted card (card invalid in this region or country).",H),
 ("visa","63","Security violation (source isn't correct issuer).",R),("visa","64","Transaction does not fulfill AML requirement.",R),
 ("visa","65","Exceeds withdrawal frequency limit.",S),("visa","75","Allowable number of PIN entry tries exceeded.",A),
 ("visa","78","Blocked, first used - transaction from new cardholder, and card not properly unblocked",H),
 ("visa","82","Negative CAM, dCVV, iCVV, or CVV results.",A),("visa","91","Issuer or switch inoperative and STIP not applicable or not available for this transaction; time-out when no stand-in.",S),
 ("visa","92","Financial institution or intermediate network facility can't be found for routing.",U),
 ("visa","93","Transaction can't be completed - violation of law.",R),("visa","94","Request is identified as a duplicate.",U),
 ("visa","96","System malfunction.",S),("visa","1A","Additional customer authentication required.",A),
 ("visa","6P","Verification data failed.",A),("visa","N5","Ineligible for resubmission.",H),("visa","N7","Decline for CVV2 failure.",A),
 ("visa","N8","Transaction amount exceeds preauthorised approval amount.",S),("visa","Q1","Card authentication failed.",A),
 ("visa","R0","Stop this payment.",H),("visa","R1","Stop all future payments.",H),("visa","R3","Stop all merchants.",H),
 ("visa","5C","Transaction not supported/blocked by issuer.",H),("visa","9G","Blocked by cardholder/contact cardholder.",H),
 # Mastercard (label from Merchant Advice Code where one is given: 01 new info, 02 try later, 03 do not retry)
 ("mastercard","01","Refer to card issuer.",U),("mastercard","12","Invalid transaction.",U),("mastercard","15","Invalid issuer.",H),
 ("mastercard","30","Format error.",U),("mastercard","91","Authorisation system or issuer system inoperative.",S),
 ("mastercard","92","Unable to route the transaction.",U),("mastercard","94","Duplicate transmission detected.",U),
 ("mastercard","96","System error.",S),("mastercard","04","Capture card.",H),("mastercard","41","Lost card.",H),
 ("mastercard","43","Stolen card.",H),("mastercard","55","Invalid PIN.",A),("mastercard","63","Security violation.",R),
 ("mastercard","51 MAC 01","Insufficient funds / over credit limit. New account information available.",H),
 ("mastercard","51 MAC 02","Insufficient funds / over credit limit. Try again later.",S),
 ("mastercard","51 MAC 03","Insufficient funds / over credit limit. Do not try again.",H),
 ("mastercard","03","Invalid merchant.",U),("mastercard","13","Invalid amount.",U),
 ("mastercard","57","Transaction not permitted to issuer / cardholder.",H),("mastercard","58","Transaction not permitted to acquirer / terminal.",U),
 ("mastercard","61","Exceeds withdrawal amount limit.",S),("mastercard","62","Restricted card.",H),
 ("mastercard","65","Exceeds withdrawal count limit (or Identity Check soft-decline of EMV 3DS authentication).",A),
 ("mastercard","75","Allowable number of PIN tries exceeded.",A),("mastercard","14 MAC 01","Invalid card number. New account information available.",H),
 ("mastercard","14 MAC 03","Invalid card number. Do not try again.",H),("mastercard","54 MAC 01","Expired card. New account information available.",H),
 ("mastercard","54 MAC 03","Expired card. Do not try again.",H),("mastercard","72","Account not yet activated.",H),
 ("mastercard","79 MAC 01","Expired card (lifecycle decline; updated card data available).",H),
 ("mastercard","79 MAC 02","Invalid credentials (lifecycle decline; can retry later).",S),
 ("mastercard","79 MAC 03","Account credentials not found (don't retry).",H),
 ("mastercard","82 MAC 03","Invalid transaction or merchant, don't retry.",H),
 ("mastercard","83 MAC 01","Suspected fraud. New account information available.",R),
 ("mastercard","83 MAC 02","Retry the transaction later.",S),("mastercard","83 MAC 03","Suspected fraud. Do not try again.",R),
 ("mastercard","05 MAC 01","Don't honour. New account information available.",H),
 ("mastercard","05 MAC 03","Don't honour. Do not try again.",H),
 # American Express
 ("amex","100","Deny.",S),("amex","101","Expired card / invalid expiry.",H),("amex","106","Exceeded PIN attempts.",A),
 ("amex","107","Call issuer.",U),("amex","109","Invalid merchant.",U),("amex","110","Invalid amount.",U),
 ("amex","111","Invalid account.",H),("amex","116","Not sufficient funds.",S),("amex","117","Invalid PIN.",A),
 ("amex","119","Not enrolled / permitted.",H),("amex","121","Limit exceeded.",S),("amex","122","Invalid CVC.",A),
 ("amex","130","Additional customer authentication required.",A),("amex","187","Deny - new card issued.",H),
 ("amex","188","Deny - account cancelled.",H),("amex","189","Deny - cancelled merchant.",U),("amex","200","Deny - pick up card.",H),
 ("amex","912","Issuer not available.",S),
 # Discover
 ("discover","05","Don't honour.",S),("discover","04","Capture card.",H),("discover","07","Pick-up card, special condition.",R),
 ("discover","14","Invalid card number.",H),("discover","41","Lost card.",H),("discover","43","Stolen card.",H),
 ("discover","51","Decline.",S),("discover","54","Expired card.",H),("discover","55","Invalid PIN.",A),
 ("discover","57","Transaction not permitted to issuer / cardholder.",H),("discover","59","Suspected fraud.",R),
 ("discover","61","Exceeds withdrawal amount limit.",S),("discover","62","Restricted card.",H),("discover","63","Security violation.",R),
 ("discover","65","Exceeds withdrawal count limit.",S),("discover","75","Allowable number of PIN tries exceeded.",A),
 ("discover","87","Network unavailable.",S),("discover","91","Authorisation system or issuer system inoperative.",S),
 ("discover","96","System malfunction.",S),("discover","N7","Decline for AVS or CID mismatch.",A),
]
for net, code, msg, lab in NETWORK:
    src = "mastercard_mac" if "MAC" in code else "draft"
    rows.append(dict(family=f"{net}:{code}", decline_code=code, decline_message=msg, label=lab, label_source=src))

with open(f"{OUT}/real_seed.csv", "w", newline="") as f:
    w = csv.DictWriter(f, fieldnames=["family", "decline_code", "decline_message", "label", "label_source"])
    w.writeheader(); w.writerows(rows)
from collections import Counter
print(len(rows), "rows ->", f"{OUT}/real_seed.csv")
print(Counter(r["label"] for r in rows)); print(Counter(r["label_source"] for r in rows))
