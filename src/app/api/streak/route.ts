import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const streak = await prisma.streakRecord.findUnique({ where: { userId: session.user.id } });
  const recentPoints = await prisma.pointTransaction.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 10,
  });
  return NextResponse.json({ streak, recentPoints });
}
