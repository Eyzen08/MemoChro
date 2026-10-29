import { AuthPage } from "@/components/auth-page";
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  return <AuthPage mode="login" message={(await searchParams).message} />;
}
