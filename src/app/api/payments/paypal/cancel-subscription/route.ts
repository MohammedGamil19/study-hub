import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cancelPayPalSubscription } from "@/lib/paypal";

/**
 * POST /api/payments/paypal/cancel-subscription
 *
 * Cancels the user's active PayPal subscription and removes premium status.
 */
export async function POST() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { paypalSubscriptionId: true },
  });

  if (!user?.paypalSubscriptionId) {
    return NextResponse.json({ error: "No active subscription" }, { status: 400 });
  }

  // Cancel with PayPal
  await cancelPayPalSubscription(user.paypalSubscriptionId);

  // Immediately revoke premium in our DB
  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      isPremium: false,
      paypalSubscriptionId: null,
    },
  });

  return NextResponse.json({ success: true });
}
