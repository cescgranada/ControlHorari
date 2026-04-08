import { PublicShell } from "@/components/layout/public-shell";

type PublicLayoutProps = {
  children: React.ReactNode;
};

export default function PublicLayout({ children }: PublicLayoutProps) {
  return <PublicShell>{children}</PublicShell>;
}
