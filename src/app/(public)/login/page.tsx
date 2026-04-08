import { LoginForm } from "@/features/auth/components/login-form";

type LoginPageProps = {
  searchParams?: {
    error?: string;
    message?: string;
  };
};

export default function LoginPage({ searchParams }: LoginPageProps) {
  return (
    <LoginForm error={searchParams?.error} message={searchParams?.message} />
  );
}
