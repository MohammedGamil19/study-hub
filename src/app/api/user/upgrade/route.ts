import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: { isPremium: true, premiumSince: new Date() },
  });
  return NextResponse.json({ isPremium: user.isPremium });
}
