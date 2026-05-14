import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Register new user
export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();
    if (!email || !password) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({ data: { name, email, password: hashed } });
    return NextResponse.json({ id: user.id, email: user.email });
  } catch (err) {
    console.error("[POST /api/user] error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// Update user preferences
export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { name, language, dailyStudyGoal } = await req.json();
  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: { name, language, dailyStudyGoal },
  });
  return NextResponse.json(user);
}

// Get current user
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, isPremium: true, language: true, dailyStudyGoal: true, image: true },
  });
  return NextResponse.json(user);
}
