import { NextResponse } from "next/server";
import { authCookieOptions } from "@/app/lib/auth";

export async function POST() {
  try {
    const { name: cookieName, options } = authCookieOptions();
    const res = NextResponse.json({ 
      success: true, 
      message: "Logged out successfully" 
    });
    
    // Clear the auth cookie by setting it to expire immediately
    res.cookies.set(cookieName, "", { 
      ...options, 
      maxAge: 0,
      expires: new Date(0) // Set to epoch time to ensure immediate expiration
    });
    
    return res;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, message: "Logout failed" }, 
      { status: 500 }
    );
  }
}


