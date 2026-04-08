import { routes } from "@/lib/constants/navigation";

import { SetPasswordForm } from "@/features/auth/components/set-password-form";

type ResetPasswordPageProps = {
  searchParams?: {
    error?: string;
    message?: string;
  };
};

export default function ResetPasswordPage({
  searchParams
}: ResetPasswordPageProps) {
  return (
    <SetPasswordForm
      title="Defineix una nova contrasenya"
      description="Aquest formulari s'utilitza després de l'enllaç de recuperació enviat per correu."
      targetRoute={routes.resetPassword}
      error={searchParams?.error}
      message={searchParams?.message}
    />
  );
}
