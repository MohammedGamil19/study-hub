import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { awardPoints } from "@/lib/points";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const review = await prisma.review.findFirst({ where: { id, subject: { userId: session.user.id } } });
  if (!review) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { title, scheduledAt, notes, status } = await req.json();
  let data: any = { title, notes };
  if (scheduledAt) data.scheduledAt = new Date(scheduledAt);
  let pointsResult = null;
  if (status === "COMPLETED" && review.status !== "COMPLETED") {
    data.status = "COMPLETED";
    data.completedAt = new Date();
    pointsResult = await awardPoints(session.user.id, "REVIEW_COMPLETE", id);
    data.pointsAwarded = pointsResult.points;
  } else if (status) {
    data.status = status;
  }
  const updated = await prisma.review.update({ where: { id }, data });
  return NextResponse.json({ ...updated, pointsResult });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const review = await prisma.review.findFirst({ where: { id, subject: { userId: session.user.id } } });
  if (!review) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.review.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
