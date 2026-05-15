import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createProductAndPlan } from "@/lib/paypal";

/**
 * GET /api/payments/paypal/setup
 *
 * One-time admin helper: creates the Study Hub Premium product + plan in PayPal
 * and returns the Plan ID to save in your Vercel environment variables.
 *
 * Only accessible by the first registered user (admin).
 * Run once, copy the planId into:
 *   PAYPAL_PLAN_ID          (server env var)
 *   NEXT_PUBLIC_PAYPAL_PLAN_ID  (public env var for the PayPal button)
 */
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const result = await createProductAndPlan();
    return NextResponse.json({
      message: "✅ PayPal product and plan created! Add these to your Vercel env vars:",
      PAYPAL_PLAN_ID: result.planId,
      NEXT_PUBLIC_PAYPAL_PLAN_ID: result.planId,
      productId: result.productId,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
