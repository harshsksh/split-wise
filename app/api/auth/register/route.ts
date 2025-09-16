import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { hashPassword, signAuthToken, authCookieOptions } from "@/app/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email: string | undefined = body?.email?.toLowerCase().trim();
    const username: string | undefined = body?.username?.trim();
    const password: string | undefined = body?.password;
    const name: string | undefined = body?.name;

    if (!email || !password || !username) {
      return NextResponse.json({ error: "Email, username and password are required" }, { status: 400 });
    }

    // Validate username format (alphanumeric, 3-20 characters)
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      return NextResponse.json({ error: "Username must be 3-20 characters, alphanumeric and underscore only" }, { status: 400 });
    }

    // Check if email or username already exists
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }

    const existingUsername = await prisma.user.findUnique({ where: { username } });
    if (existingUsername) {
      return NextResponse.json({ error: "Username already taken" }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({ 
      data: { 
        email, 
        username, 
        passwordHash, 
        name 
      } 
    });

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


