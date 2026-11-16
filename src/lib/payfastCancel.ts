import crypto from "crypto";

// PHP-style urlencode (uppercase hex, spaces as "+"), which PayFast expects.
function enc(value: string) {
  return encodeURIComponent(value)
    .replace(/%20/g, "+")
    .replace(/[!'()*~]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());
}

// Cancels a PayFast recurring subscription by its token.
// PUT https://api.payfast.co.za/subscriptions/{token}/cancel
// Signature = md5 of the header fields + passphrase, sorted alphabetically.
export async function cancelPayFastSubscription(
  token: string
): Promise<{ ok: boolean; message: string }> {
  const merchantId = process.env.PAYFAST_MERCHANT_ID;
  const passphrase = process.env.PAYFAST_PASSPHRASE ?? "";
  if (!merchantId) return { ok: false, message: "PAYFAST_MERCHANT_ID is not set" };

  // ISO 8601 with an explicit offset, no milliseconds.
  const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, "+00:00");

  const headers: Record<string, string> = {
    "merchant-id": merchantId,
    version: "v1",
    timestamp,
  };

  const toSign: Record<string, string> = { ...headers };
  if (passphrase) toSign.passphrase = passphrase;

  const paramString = Object.keys(toSign)
    .sort()
    .map((k) => `${k}=${enc(toSign[k].trim())}`)
    .join("&");
  const signature = crypto.createHash("md5").update(paramString).digest("hex");

  const sandbox = process.env.PAYFAST_SANDBOX === "true";
  const url = `https://api.payfast.co.za/subscriptions/${encodeURIComponent(token)}/cancel${
    sandbox ? "?testing=true" : ""
  }`;

  try {
    const res = await fetch(url, { method: "PUT", headers: { ...headers, signature } });
    const text = await res.text();
    console.log("PayFast cancel response:", res.status, text);

    let body: { status?: string; data?: { message?: string } } = {};
    try {
      body = JSON.parse(text);
    } catch {}

    const message = body.data?.message ?? text.slice(0, 200);
    if (res.ok && body.status === "success") return { ok: true, message };
    // Already cancelled on PayFast's side counts as success for our purposes.
    if (/already/i.test(message) && /cancel/i.test(message)) return { ok: true, message };
    return { ok: false, message: message || `PayFast returned ${res.status}` };
  } catch (err) {
    console.error("PayFast cancel request failed:", err);
    return { ok: false, message: "Could not reach PayFast" };
  }
}
