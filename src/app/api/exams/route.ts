import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const subjectId = req.nextUrl.searchParams.get("subjectId");
  if (!subjectId) return NextResponse.json({ error: "subjectId required" }, { status: 400 });
  const exams = await prisma.exam.findMany({
    where: { subjectId, subject: { userId: session.user.id } },
    orderBy: { scheduledAt: "asc" },
  });
  return NextResponse.json(exams);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { subjectId, title, type, scheduledAt, location, notes } = await req.json();
  const subject = await prisma.subject.findFirst({ where: { id: subjectId, userId: session.user.id } });
  if (!subject) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const exam = await prisma.exam.create({ data: { subjectId, title, type: type || "EXAM", scheduledAt: new Date(scheduledAt), location, notes } });
  return NextResponse.json(exam, { status: 201 });
}
