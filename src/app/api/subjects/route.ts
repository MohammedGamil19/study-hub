import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FREE_SUBJECT_LIMIT } from "@/lib/utils";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const subjects = await prisma.subject.findMany({
    where: { userId: session.user.id, isArchived: false },
    include: {
      _count: { select: { chapters: true, tasks: true } },
      chapters: { select: { isCompleted: true } },
    },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(subjects);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!session.user.isPremium) {
    const count = await prisma.subject.count({ where: { userId: session.user.id, isArchived: false } });
    if (count >= FREE_SUBJECT_LIMIT) {
      return NextResponse.json({ error: "SUBJECT_LIMIT_REACHED" }, { status: 403 });
    }
  }

  const { name, nameAr, color, icon } = await req.json();
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const subject = await prisma.subject.create({
    data: { userId: session.user.id, name, nameAr, color: color || "#6366f1", icon: icon || "📚" },
  });
  return NextResponse.json(subject, { status: 201 });
}
