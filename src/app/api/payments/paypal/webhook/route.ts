import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature } from "@/lib/paypal";

/**
 * POST /api/payments/paypal/webhook
 *
 * PayPal sends events here for subscription lifecycle changes.
 * Register this URL in PayPal Developer Dashboard → Webhooks.
 *
 * Handled events:
 *   BILLING.SUBSCRIPTION.CANCELLED  → revoke premium
 *   BILLING.SUBSCRIPTION.EXPIRED    → revoke premium
 *   BILLING.SUBSCRIPTION.SUSPENDED  → revoke premium
 *   BILLING.SUBSCRIPTION.ACTIVATED  → (re-)activate premium
 *   PAYMENT.SALE.COMPLETED          → confirm continued access (no-op)
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  // Verify the webhook really came from PayPal
  const headers: Record<string, string> = {};
  req.headers.forEach((v, k) => { headers[k] = v; });

  const valid = await verifyWebhookSignature(headers, rawBody);
  if (!valid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody);
  const eventType: string = event.event_type;
  const subscriptionId: string | undefined =
    event.resource?.id ??
    event.resource?.billing_agreement_id;

  if (!subscriptionId) {
    return NextResponse.json({ ok: true }); // nothing to do
  }

  if (
    eventType === "BILLING.SUBSCRIPTION.CANCELLED" ||
    eventType === "BILLING.SUBSCRIPTION.EXPIRED" ||
    eventType === "BILLING.SUBSCRIPTION.SUSPENDED"
  ) {
    // Revoke premium for the user who owns this subscription
    await prisma.user.updateMany({
      where: { paypalSubscriptionId: subscriptionId },
      data: { isPremium: false, paypalSubscriptionId: null },
    });
  }

  if (eventType === "BILLING.SUBSCRIPTION.ACTIVATED") {
    // Make sure premium is on (handles reactivation after payment failure)
    await prisma.user.updateMany({
      where: { paypalSubscriptionId: subscriptionId },
      data: { isPremium: true },
    });
  }

  return NextResponse.json({ ok: true });
}
