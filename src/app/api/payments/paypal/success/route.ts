import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSubscription } from "@/lib/paypal";

/**
 * GET /api/payments/paypal/success?subscription_id=...&token=...
 *
 * PayPal redirects here after the user approves the subscription.
 * We verify it's genuinely ACTIVE then upgrade the user.
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  const baseUrl =
    process.env.NEXTAUTH_URL ??
    process.env.AUTH_URL ??
    "https://study-hub-beryl.vercel.app";

  if (!session) {
    return NextResponse.redirect(`${baseUrl}/login`);
  }

  const subscriptionId =
    req.nextUrl.searchParams.get("subscription_id") ??
    req.nextUrl.searchParams.get("token"); // PayPal sometimes uses "token"

  if (!subscriptionId) {
    return NextResponse.redirect(`${baseUrl}/settings?payment=error`);
  }

  try {
    const subscription = await getSubscription(subscriptionId);

    // PayPal subscription can be ACTIVE or APPROVAL_PENDING right after approval
    if (
      subscription.status !== "ACTIVE" &&
      subscription.status !== "APPROVAL_PENDING"
    ) {
      return NextResponse.redirect(`${baseUrl}/settings?payment=error`);
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        isPremium: true,
        premiumSince: new Date(),
        paypalSubscriptionId: subscriptionId,
      },
    });

    return NextResponse.redirect(`${baseUrl}/settings?payment=success`);
  } catch {
    return NextResponse.redirect(`${baseUrl}/settings?payment=error`);
  }
}
