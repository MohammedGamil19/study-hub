import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getSubscriptionApprovalUrl } from "@/lib/paypal";

/**
 * POST /api/payments/paypal/create-subscription
 *
 * Creates a PayPal subscription and returns the URL to redirect the user to
 * for approval. Uses the server-side REST API — no client-side SDK needed.
 */
export async function POST() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const planId = process.env.PAYPAL_PLAN_ID;
  if (!planId) return NextResponse.json({ error: "PayPal plan not configured" }, { status: 500 });

  const baseUrl =
    process.env.NEXTAUTH_URL ??
    process.env.AUTH_URL ??
    "https://study-hub-beryl.vercel.app";

  const approvalUrl = await getSubscriptionApprovalUrl(planId, {
    returnUrl: `${baseUrl}/api/payments/paypal/success`,
    cancelUrl: `${baseUrl}/settings?payment=cancelled`,
  });

  return NextResponse.json({ approvalUrl });
}
