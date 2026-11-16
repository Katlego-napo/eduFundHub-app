import crypto from "crypto";
import dns from "dns/promises";

export const PAYFAST_SANDBOX = process.env.PAYFAST_SANDBOX === "true";
export const PAYFAST_HOST = PAYFAST_SANDBOX ? "sandbox.payfast.co.za" : "www.payfast.co.za";
export const PAYFAST_URL = `https://${PAYFAST_HOST}/eng/process`;
export const PAYFAST_VALIDATE_URL = `https://${PAYFAST_HOST}/eng/query/validate`;

export const MERCHANT_ID = process.env.PAYFAST_MERCHANT_ID ?? "";
export const MERCHANT_KEY = process.env.PAYFAST_MERCHANT_KEY ?? "";
export const PASSPHRASE = process.env.PAYFAST_PASSPHRASE ?? "";
// e.g. https://edufundhub.co.za  (no trailing slash)
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/+$/, "");

export type PayfastPlan = "monthly" | "yearly";

export const PLAN_CONFIG: Record<
  PayfastPlan,
  {
    amount: string;
    item_name: string;
    label: string;
    recurring: boolean; // monthly renews automatically; yearly is a single payment
    months: number; // how much access one payment buys
  }
> = {
  monthly: {
    amount: "69.00",
    item_name: "EduFund Hub Monthly Plan",
    label: "Monthly plan",
    recurring: true,
    months: 1,
  },
  yearly: {
    amount: "759.00",
    item_name: "EduFund Hub Yearly Plan (11 months)",
    label: "Yearly plan",
    recurring: false,
    months: 11,
  },
};

export function isPayfastPlan(value: unknown): value is PayfastPlan {
  return value === "monthly" || value === "yearly";
}

// Adds calendar months, clamping the day (31 Jan + 1 month = 28/29 Feb).
export function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, lastDay));
  return d;
}

// PayFast's backend is PHP, so signatures use PHP urlencode() escaping.
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

// Two different rules, and mixing them up was the original bug:
//  - CHECKOUT (what we send): skip empty fields and trim values.
//  - ITN (what PayFast sends us): use EVERY field exactly as received,
//    including the empty ones, or the signature will never match.
function buildParamString(data: Record<string, string>, mode: "checkout" | "itn"): string {
  return Object.entries(data)
    .filter(([key, value]) => {
      if (key === "signature") return false;
      return mode === "itn" ? true : String(value).trim() !== "";
    })
    .map(([key, value]) => {
      const v = mode === "checkout" ? String(value).trim() : String(value);
      return `${key}=${phpUrlEncode(v)}`;
    })
    .join("&");
}

function sign(paramString: string): string {
  const full = PASSPHRASE ? `${paramString}&passphrase=${phpUrlEncode(PASSPHRASE.trim())}` : paramString;
  return crypto.createHash("md5").update(full).digest("hex");
}

export function signCheckout(data: Record<string, string>): string {
  return sign(buildParamString(data, "checkout"));
}

export function itnSignatureIsValid(body: Record<string, string>): boolean {
  return sign(buildParamString(body, "itn")) === body.signature;
}

function nextBillingDate(): string {
  // First payment is taken now; the first automatic renewal is one month later.
  return addMonths(new Date(), 1).toISOString().slice(0, 10);
}

/** Builds the signed fields the browser posts to PayFast. Field ORDER matters. */
export function buildPaymentData(
  plan: PayfastPlan,
  userId: string,
  userEmail: string,
  userName: string,
  paymentId: string
): Record<string, string> {
  const cfg = PLAN_CONFIG[plan];
  const [first, ...rest] = userName.trim().split(/\s+/);

  const data: Record<string, string> = {
    merchant_id: MERCHANT_ID,
    merchant_key: MERCHANT_KEY,
    return_url: `${SITE_URL}/payment/success`,
    cancel_url: `${SITE_URL}/pricing?status=cancelled`,
    notify_url: `${SITE_URL}/api/payfast/notify`,

    name_first: first || "Student",
    name_last: rest.join(" ") || "-",
    email_address: userEmail,

    m_payment_id: paymentId,
    amount: cfg.amount,
    item_name: cfg.item_name,

    // Echoed back in the notification so we know who paid for what.
    custom_str1: userId,
    custom_str2: plan,
  };

  if (cfg.recurring) {
    data.subscription_type = "1";
    data.billing_date = nextBillingDate();
    data.recurring_amount = cfg.amount;
    data.frequency = "3"; // monthly
    data.cycles = "0"; // until cancelled
  }

  for (const k of Object.keys(data)) {
    if (!String(data[k]).trim()) delete data[k];
  }
  data.signature = signCheckout(data);
  return data;
}

async function sourceIpIsPayFast(ip: string | null): Promise<boolean | null> {
  if (!ip) return null;
  try {
    const hosts = ["www.payfast.co.za", "w1w.payfast.co.za", "w2w.payfast.co.za", "sandbox.payfast.co.za"];
    const valid = new Set<string>();
    for (const h of hosts) {
      try {
        (await dns.lookup(h, { all: true })).forEach((r) => valid.add(r.address));
      } catch {}
    }
    if (valid.size === 0) return null;
    return valid.has(ip);
  } catch {
    return null;
  }
}

export type ItnCheck = { valid: boolean; reason?: string; ipOk: boolean | null };

/**
 * Checks a PayFast notification is genuine:
 *  1. signature matches (all fields, including empty ones)
 *  2. it is for our merchant account
 *  3. PayFast itself confirms it (server-to-server)
 * The source IP is checked too, but only reported: the server-to-server
 * confirmation in step 3 is the strong check, and PayFast's IP list changes.
 */
export async function verifyItn(body: Record<string, string>, clientIp: string | null): Promise<ItnCheck> {
  if (!itnSignatureIsValid(body)) {
    return { valid: false, reason: "Signature mismatch (check PAYFAST_PASSPHRASE matches the PayFast dashboard)", ipOk: null };
  }
  if (body.merchant_id !== MERCHANT_ID) {
    return { valid: false, reason: "Merchant ID mismatch", ipOk: null };
  }

  try {
    const res = await fetch(PAYFAST_VALIDATE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: buildParamString(body, "itn"),
      signal: AbortSignal.timeout(10000),
    });
    const text = (await res.text()).trim().toUpperCase();
    if (!text.startsWith("VALID")) {
      return { valid: false, reason: `PayFast did not confirm the notification: ${text.slice(0, 80)}`, ipOk: null };
    }
  } catch (err) {
    return { valid: false, reason: `Could not reach PayFast to confirm: ${String(err)}`, ipOk: null };
  }

  return { valid: true, ipOk: await sourceIpIsPayFast(clientIp) };
}
