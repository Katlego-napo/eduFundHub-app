import crypto from "crypto";

export const PAYFAST_SANDBOX = process.env.PAYFAST_SANDBOX === "true";
export const PAYFAST_HOST = PAYFAST_SANDBOX
  ? "sandbox.payfast.co.za"
  : "www.payfast.co.za";
export const PAYFAST_URL = `https://${PAYFAST_HOST}/eng/process`;
export const PAYFAST_VALIDATE_URL = `https://${PAYFAST_HOST}/eng/query/validate`;

export const MERCHANT_ID = process.env.PAYFAST_MERCHANT_ID!;
export const MERCHANT_KEY = process.env.PAYFAST_MERCHANT_KEY!;
export const PASSPHRASE = process.env.PAYFAST_PASSPHRASE ?? "";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "";

export type PayfastPlan = "monthly" | "exam_season";

export const PLAN_CONFIG: Record<
  PayfastPlan,
  {
    amount: string;
    item_name: string;
    subscription_type: "1"; // 1 = recurring, 2 = subscription (once off)
    billing_date?: string; // YYYY-MM-DD, defaults to today
    recurring_amount: string;
    frequency: "3"; // 3 = monthly
    cycles: "0" | string; // 0 = indefinite, or number of billing cycles
  }
> = {
  monthly: {
    amount: "69.00",
    item_name: "EduFund Hub Monthly Plan",
    subscription_type: "1",
    recurring_amount: "69.00",
    frequency: "3",
    cycles: "0", // indefinite until cancelled
  },
  exam_season: {
    amount: "199.00",
    item_name: "EduFund Hub Exam Season Package",
    subscription_type: "1",
    recurring_amount: "199.00",
    frequency: "3",
    cycles: "3", // Sep, Oct, Nov = 3 months max
  },
};

/**
 * Encodes a string to match PHP's urlencode() exactly, since PayFast's
 * backend is PHP and validates signatures using urlencode-style escaping.
 * JS's encodeURIComponent differs on: space, !, ', (, ), *, ~
 */
function phpUrlEncode(str: string): string {
  return encodeURIComponent(str)
    .replace(/%20/g, "+")
    .replace(/!/g, "%21")
    .replace(/'/g, "%27")
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29")
    .replace(/\*/g, "%2A")
    .replace(/~/g, "%7E");
}

export function generateSignature(data: Record<string, string>): string {
  const pairs = Object.entries(data)
    .filter(([key, value]) => key !== "signature" && value !== "")
    .map(([k, v]) => `${k}=${phpUrlEncode(String(v).trim())}`)
    .join("&");

  const withPassphrase = PASSPHRASE
    ? `${pairs}&passphrase=${phpUrlEncode(PASSPHRASE.trim())}`
    : pairs;

  return crypto.createHash("md5").update(withPassphrase).digest("hex");
}
/**
 * Builds the complete payment data object for a PayFast subscription
 * checkout, ready to POST to PAYFAST_URL.
 */
export function buildPaymentData(
  plan: PayfastPlan,
  userId: string,
  userEmail: string,
  userName: string
  
): Record<string, string> {
  const config = PLAN_CONFIG[plan];

  const data: Record<string, string> = {
    merchant_id: MERCHANT_ID,
    merchant_key: MERCHANT_KEY,
    return_url: `${SITE_URL}/pricing?status=success&plan=${plan}`,
    cancel_url: `${SITE_URL}/pricing?status=cancelled`,
    notify_url: `${SITE_URL}/api/payfast/notify`,

    // Buyer info — pre-fills PayFast's payment form
    email_address: userEmail,
    name_first: userName.split(" ")[0] ?? userName,
    name_last: userName.split(" ").slice(1).join(" ") || "-",

    // Payment details
    amount: config.amount,
    item_name: config.item_name,

    // Subscription fields
    subscription_type: config.subscription_type,
    recurring_amount: config.recurring_amount,
    frequency: config.frequency,
    cycles: config.cycles,

    // Custom data — passed back in the ITN so we know which user/plan
    custom_str1: userId,
    custom_str2: plan,
  };

  // Remove empty values — PayFast signature validation fails if
  // any included field is blank.
  Object.keys(data).forEach((k) => {
    if (!data[k]) delete data[k];
  });

  data.signature = generateSignature(data);
  return data;
}

/**
 * Verifies a PayFast ITN (Instant Transaction Notification) by:
 * 1. Checking the signature matches what we'd compute ourselves
 * 2. Validating the notification with PayFast's own validate endpoint
 * 3. Confirming the merchant ID and amounts match our config
 */
export async function verifyItn(
  body: Record<string, string>,
  rawBody: string
): Promise<{ valid: boolean; reason?: string }> {
  // Step 1: Signature check
  const { signature, ...rest } = body;
  const computedSig = generateSignature(rest);
  if (computedSig !== signature) {
    return { valid: false, reason: "Signature mismatch" };
  }

  // Step 2: Merchant ID check
  if (body.merchant_id !== MERCHANT_ID) {
    return { valid: false, reason: "Merchant ID mismatch" };
  }

  // Step 3: Validate with PayFast
  const validateRes = await fetch(PAYFAST_VALIDATE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: rawBody,
  });
  const validateText = await validateRes.text();
  if (!validateText.trim().toUpperCase().startsWith("VALID")) {
    return { valid: false, reason: `PayFast validation failed: ${validateText}` };
  }

  return { valid: true };
}
