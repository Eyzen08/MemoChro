import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

export const configured = () =>
  !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );

export async function supabase() {
  if (!configured())
    throw new Error(
      "Connect Supabase using the environment variables in .env.example.",
    );
  const jar = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => jar.getAll(),
        setAll(values) {
          try {
            values.forEach(({ name, value, options }) =>
              jar.set(name, value, options),
            );
          } catch {
            /* Server components refresh cookies through proxy.ts. */
          }
        },
      },
    },
  );
}

export const requireUser = cache(async () => {
  if (!configured())
    redirect("/login?message=Connect+Supabase+to+open+your+archive.");
  const db = await supabase();
  const {
    data: { user },
    error,
  } = await db.auth.getUser();
  if (error || !user) redirect("/login");
  return { db, user };
});

export function check(error: { message: string } | null) {
  if (error) {
    console.error("Archive operation failed:", error.message);
    throw new Error(
      "The archive could not complete this request. Please try again.",
    );
  }
}
