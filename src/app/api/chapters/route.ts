import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const subjectId = req.nextUrl.searchParams.get("subjectId");
  if (!subjectId) return NextResponse.json({ error: "subjectId required" }, { status: 400 });
  const chapters = await prisma.chapter.findMany({
    where: { subjectId, subject: { userId: session.user.id } },
    orderBy: { orderIndex: "asc" },
  });
  return NextResponse.json(chapters);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { subjectId, title } = await req.json();
  const subject = await prisma.subject.findFirst({ where: { id: subjectId, userId: session.user.id } });
  if (!subject) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const count = await prisma.chapter.count({ where: { subjectId } });
  const chapter = await prisma.chapter.create({ data: { subjectId, title, orderIndex: count } });
  return NextResponse.json(chapter, { status: 201 });
}
