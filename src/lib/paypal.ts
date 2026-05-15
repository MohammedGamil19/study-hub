/**
 * PayPal REST API helpers — server-side only.
 * Set PAYPAL_MODE=live in production; defaults to sandbox.
 */

const BASE =
  process.env.PAYPAL_MODE === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

async function getAccessToken(): Promise<string> {
  const id = process.env.PAYPAL_CLIENT_ID ?? "";
  const secret = process.env.PAYPAL_CLIENT_SECRET ?? "";
  const credentials = Buffer.from(`${id}:${secret}`).toString("base64");

  const res = await fetch(`${BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  const data = await res.json();
  if (!data.access_token) {
    throw new Error(`PayPal auth failed: ${JSON.stringify(data)}`);
  }
  return data.access_token as string;
}

/**
 * Create a PayPal subscription and return the URL the user must visit to approve it.
 * Used by the redirect-based checkout flow.
 */
export async function getSubscriptionApprovalUrl(
  planId: string,
  { returnUrl, cancelUrl }: { returnUrl: string; cancelUrl: string }
): Promise<string> {
  const token = await getAccessToken();
  const res = await fetch(`${BASE}/v1/billing/subscriptions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": `sub-${Date.now()}`,
    },
    body: JSON.stringify({
      plan_id: planId,
      application_context: {
        brand_name: "Study Hub",
        locale: "en-US",
        shipping_preference: "NO_SHIPPING",
        user_action: "SUBSCRIBE_NOW",
        return_url: returnUrl,
        cancel_url: cancelUrl,
      },
    }),
    cache: "no-store",
  });

  const data = await res.json();
  const approvalLink = (data.links as any[])?.find((l: any) => l.rel === "approve");
  if (!approvalLink) throw new Error(`PayPal subscription error: ${JSON.stringify(data)}`);
  return approvalLink.href as string;
}

/** Fetch subscription details from PayPal. */
export async function getSubscription(subscriptionId: string) {
  const token = await getAccessToken();
  const res = await fetch(`${BASE}/v1/billing/subscriptions/${subscriptionId}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  return res.json();
}

/** Cancel a subscription in PayPal. */
export async function cancelPayPalSubscription(
  subscriptionId: string,
  reason = "User requested cancellation"
): Promise<boolean> {
  const token = await getAccessToken();
  const res = await fetch(
    `${BASE}/v1/billing/subscriptions/${subscriptionId}/cancel`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reason }),
    }
  );
  return res.ok || res.status === 422; // 422 = already cancelled
}

/**
 * Verify a PayPal webhook signature.
 * Requires PAYPAL_WEBHOOK_ID env var (get it from the PayPal dashboard
 * after registering your webhook URL).
 */
export async function verifyWebhookSignature(
  rawHeaders: Record<string, string>,
  rawBody: string
): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) return true; // skip verification if not configured

  const token = await getAccessToken();
  const res = await fetch(`${BASE}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      auth_algo: rawHeaders["paypal-auth-algo"],
      cert_url: rawHeaders["paypal-cert-url"],
      transmission_id: rawHeaders["paypal-transmission-id"],
      transmission_sig: rawHeaders["paypal-transmission-sig"],
      transmission_time: rawHeaders["paypal-transmission-time"],
      webhook_id: webhookId,
      webhook_event: JSON.parse(rawBody),
    }),
  });
  const data = await res.json();
  return data.verification_status === "SUCCESS";
}

/**
 * One-time setup: creates the Study Hub Premium product + $10/month plan.
 * Returns the plan ID to save in PAYPAL_PLAN_ID / NEXT_PUBLIC_PAYPAL_PLAN_ID.
 */
export async function createProductAndPlan(): Promise<{
  productId: string;
  planId: string;
}> {
  const token = await getAccessToken();

  // Create product (idempotent via PayPal-Request-Id)
  const productRes = await fetch(`${BASE}/v1/catalogs/products`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": "study-hub-premium-product-v1",
    },
    body: JSON.stringify({
      name: "Study Hub Premium",
      description: "Unlimited subjects, analytics, AI summarizer & more.",
      type: "SERVICE",
      category: "SOFTWARE",
    }),
  });
  const product = await productRes.json();

  // Create $10/month recurring plan
  const planRes = await fetch(`${BASE}/v1/billing/plans`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": "study-hub-premium-plan-v1",
    },
    body: JSON.stringify({
      product_id: product.id,
      name: "Study Hub Premium — Monthly",
      description: "$10/month — unlimited access to all features",
      status: "ACTIVE",
      billing_cycles: [
        {
          frequency: { interval_unit: "MONTH", interval_count: 1 },
          tenure_type: "REGULAR",
          sequence: 1,
          total_cycles: 0, // 0 = infinite
          pricing_scheme: {
            fixed_price: { value: "10", currency_code: "USD" },
          },
        },
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee_failure_action: "CONTINUE",
        payment_failure_threshold: 1,
      },
    }),
  });
  const plan = await planRes.json();

  return { productId: product.id, planId: plan.id };
}
