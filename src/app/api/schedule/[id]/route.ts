import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const event = await prisma.scheduleEvent.findFirst({ where: { id, subject: { userId: session.user.id } } });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { title, dayOfWeek, startTime, endTime, notifyBefore } = await req.json();
  const updated = await prisma.scheduleEvent.update({ where: { id }, data: { title, dayOfWeek, startTime, endTime, notifyBefore } });
  return NextResponse.json(updated);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const event = await prisma.scheduleEvent.findFirst({ where: { id, subject: { userId: session.user.id } } });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.scheduleEvent.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
