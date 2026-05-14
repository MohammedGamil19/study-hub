import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const exam = await prisma.exam.findFirst({ where: { id, subject: { userId: session.user.id } } });
  if (!exam) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { title, type, scheduledAt, location, notes } = await req.json();
  const updated = await prisma.exam.update({
    where: { id },
    data: { title, type, scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined, location, notes },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const exam = await prisma.exam.findFirst({ where: { id, subject: { userId: session.user.id } } });
  if (!exam) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.exam.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
