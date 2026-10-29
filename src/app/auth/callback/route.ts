import { NextResponse, type NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";
import { safeNext } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (code) {
    const db = await supabase();
    const { error } = await db.auth.exchangeCodeForSession(code);
    if (!error)
      return NextResponse.redirect(
        new URL(
          safeNext(request.nextUrl.searchParams.get("next")),
          request.url,
        ),
      );
  }
  return NextResponse.redirect(
    new URL(
      "/login?message=This+link+has+expired.+Please+request+a+new+one.",
      request.url,
    ),
  );
}
