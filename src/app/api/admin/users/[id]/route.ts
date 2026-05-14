import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ADMIN_EMAIL = "mohamadshogaa7712@gmail.com";

async function checkAdmin() {
  const session = await auth();
  return session?.user?.email === ADMIN_EMAIL;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await checkAdmin()))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { isPremium } = await req.json();

  const user = await prisma.user.update({
    where: { id },
    data: {
      isPremium,
      premiumSince: isPremium ? new Date() : null,
    },
  });
  return NextResponse.json(user);
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await checkAdmin()))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (user.email === ADMIN_EMAIL)
    return NextResponse.json({ error: "Cannot delete admin account" }, { status: 400 });

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
