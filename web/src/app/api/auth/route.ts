import { NextRequest, NextResponse } from "next/server";

const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function POST(req: NextRequest) {
  const { token } = await req.json();
  const expected = process.env.INTERNAL_ACCESS_TOKEN;

  if (!expected) {
    // No token configured → open access (dev mode)
    const res = NextResponse.json({ ok: true });
    res.cookies.set("auth", "open", { httpOnly: true, maxAge: MAX_AGE, path: "/" });
    return res;
  }

  if (token !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("auth", token, { httpOnly: true, maxAge: MAX_AGE, path: "/", secure: process.env.NODE_ENV === "production" });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete("auth");
  return res;
}
