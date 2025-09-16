import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { verifyAuthToken, authCookieOptions } from "./auth";

// Function to get current authenticated user from API routes and server components
export async function getCurrentUser() {
  const { name: cookieName } = authCookieOptions();
  const cookieStore = await cookies();
  const token = cookieStore.get(cookieName)?.value;

  if (!token) {
    throw new Error("No authentication token found");
  }

  try {
    const payload = verifyAuthToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { 
        id: true, 
        email: true, 
        username: true, 
        name: true, 
        createdAt: true 
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  } catch (error) {
    throw new Error("Invalid authentication token");
  }
}
