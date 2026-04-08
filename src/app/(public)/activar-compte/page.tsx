import { routes } from "@/lib/constants/navigation";

import { SetPasswordForm } from "@/features/auth/components/set-password-form";

type ActivateAccountPageProps = {
  searchParams?: {
    error?: string;
    message?: string;
  };
};

export default function ActivateAccountPage({
  searchParams
}: ActivateAccountPageProps) {
  return (
    <SetPasswordForm
      title="Activa el teu compte"
      description="Quan accedeixes des de la invitació, pots establir aquí la teva contrasenya inicial."
      targetRoute={routes.activateAccount}
      error={searchParams?.error}
      message={searchParams?.message}
    />
  );
}
