import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { verifyPassword, signAuthToken, authCookieOptions } from "@/app/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email: string | undefined = body?.email?.toLowerCase().trim();
    const password: string | undefined = body?.password;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

    const token = signAuthToken({ sub: user.id, email: user.email });
    const { name: cookieName, options } = authCookieOptions();
    const res = NextResponse.json({ 
      id: user.id, 
      email: user.email, 
      username: user.username, 
      name: user.name 
    });
    res.cookies.set(cookieName, token, options);
    return res;
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  } 
}


