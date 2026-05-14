import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { awardPoints } from "@/lib/points";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const task = await prisma.task.findFirst({ where: { id, subject: { userId: session.user.id } } });
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { title, description, dueDate, priority, status } = await req.json();
  let data: any = { title, description, priority };
  if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null;
  let pointsResult = null;
  if (status !== undefined) {
    data.status = status;
    if (status === "COMPLETED" && task.status !== "COMPLETED") {
      data.completedAt = new Date();
      pointsResult = await awardPoints(session.user.id, "TASK_COMPLETE", id);
    } else if (status !== "COMPLETED") {
      data.completedAt = null;
    }
  }
  const updated = await prisma.task.update({ where: { id }, data });
  return NextResponse.json({ ...updated, pointsResult });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const task = await prisma.task.findFirst({ where: { id, subject: { userId: session.user.id } } });
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.task.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
