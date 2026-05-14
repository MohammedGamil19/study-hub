import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const lecture = await prisma.lecture.findFirst({ where: { id, subject: { userId: session.user.id } } });
  if (!lecture) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { title, dayOfWeek, startTime, endTime, location, isActive } = await req.json();
  const updated = await prisma.lecture.update({ where: { id }, data: { title, dayOfWeek, startTime, endTime, location, isActive } });
  return NextResponse.json(updated);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const lecture = await prisma.lecture.findFirst({ where: { id, subject: { userId: session.user.id } } });
  if (!lecture) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.lecture.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
