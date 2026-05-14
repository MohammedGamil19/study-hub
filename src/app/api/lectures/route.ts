import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const subjectId = req.nextUrl.searchParams.get("subjectId");
  if (!subjectId) return NextResponse.json({ error: "subjectId required" }, { status: 400 });
  const lectures = await prisma.lecture.findMany({
    where: { subjectId, subject: { userId: session.user.id } },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });
  return NextResponse.json(lectures);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { subjectId, title, dayOfWeek, startTime, endTime, location } = await req.json();
  const subject = await prisma.subject.findFirst({ where: { id: subjectId, userId: session.user.id } });
  if (!subject) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const lecture = await prisma.lecture.create({ data: { subjectId, title, dayOfWeek, startTime, endTime, location } });
  return NextResponse.json(lecture, { status: 201 });
}
