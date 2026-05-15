import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSubscription } from "@/lib/paypal";

/**
 * POST /api/payments/paypal/capture
 * Body: { subscriptionId: string }
 *
 * Called by the PayPal button's onApprove callback.
 * Verifies the subscription is ACTIVE with PayPal, then upgrades the user.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { subscriptionId } = await req.json();
  if (!subscriptionId) {
    return NextResponse.json({ error: "Missing subscriptionId" }, { status: 400 });
  }

  // Verify with PayPal that the subscription is genuinely active
  const subscription = await getSubscription(subscriptionId);
  if (subscription.status !== "ACTIVE") {
    return NextResponse.json(
      { error: `Subscription is ${subscription.status}, not ACTIVE` },
      { status: 400 }
    );
  }

  // Upgrade the user in the database
  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      isPremium: true,
      premiumSince: new Date(),
      paypalSubscriptionId: subscriptionId,
    },
  });

  return NextResponse.json({ success: true });
}
