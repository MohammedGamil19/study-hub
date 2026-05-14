import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const subjectId = req.nextUrl.searchParams.get("subjectId");
  if (!subjectId) return NextResponse.json({ error: "subjectId required" }, { status: 400 });
  const tasks = await prisma.task.findMany({
    where: { subjectId, subject: { userId: session.user.id } },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { subjectId, title, description, dueDate, priority, isRecurring, recurringDay } = await req.json();
  const subject = await prisma.subject.findFirst({ where: { id: subjectId, userId: session.user.id } });
  if (!subject) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const task = await prisma.task.create({
    data: { subjectId, title, description, dueDate: dueDate ? new Date(dueDate) : null, priority: priority || "MEDIUM", isRecurring, recurringDay },
  });
  return NextResponse.json(task, { status: 201 });
}
