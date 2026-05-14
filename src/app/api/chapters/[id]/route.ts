import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { awardPoints } from "@/lib/points";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { title, orderIndex, isCompleted } = await req.json();

  const chapter = await prisma.chapter.findFirst({
    where: { id, subject: { userId: session.user.id } },
  });
  if (!chapter) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let data: any = { title, orderIndex };
  let pointsResult = null;

  if (isCompleted !== undefined && isCompleted !== chapter.isCompleted) {
    data.isCompleted = isCompleted;
    data.completedAt = isCompleted ? new Date() : null;
    if (isCompleted) {
      pointsResult = await awardPoints(session.user.id, "CHAPTER_COMPLETE", id);
    }
  }

  const updated = await prisma.chapter.update({ where: { id }, data });
  return NextResponse.json({ ...updated, pointsResult });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const chapter = await prisma.chapter.findFirst({ where: { id, subject: { userId: session.user.id } } });
  if (!chapter) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.chapter.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
