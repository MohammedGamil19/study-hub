import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getSubject(id: string, userId: string) {
  return prisma.subject.findFirst({ where: { id, userId } });
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const subject = await getSubject(id, session.user.id);
  if (!subject) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(subject);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const existing = await getSubject(id, session.user.id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { name, nameAr, color, icon } = await req.json();
  const subject = await prisma.subject.update({ where: { id }, data: { name, nameAr, color, icon } });
  return NextResponse.json(subject);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const existing = await getSubject(id, session.user.id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.subject.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
