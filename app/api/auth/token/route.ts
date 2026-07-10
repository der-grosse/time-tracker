import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// Used for client convex authorization
export async function GET() {
  const token = (await cookies()).get("jwt")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ token });
}
