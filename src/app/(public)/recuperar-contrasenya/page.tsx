import { PasswordResetRequestForm } from "@/features/auth/components/password-reset-request-form";

type RecoverPasswordPageProps = {
  searchParams?: {
    error?: string;
    message?: string;
  };
};

export default function RecoverPasswordPage({
  searchParams
}: RecoverPasswordPageProps) {
  return (
    <PasswordResetRequestForm
      error={searchParams?.error}
      message={searchParams?.message}
    />
  );
}
