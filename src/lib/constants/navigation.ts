import type { NavigationItem } from "@/types/navigation";

export const routes = {
  login: "/login",
  activateAccount: "/activar-compte",
  recoverPassword: "/recuperar-contrasenya",
  resetPassword: "/restablir-contrasenya",
  app: "/app",
  adminUsers: "/app/admin/usuaris",
  adminEntries: "/app/admin/entrades",
  adminHolidays: "/app/admin/festius",
  history: "/app/historial",
  reports: "/app/informes",
  profile: "/app/perfil",
  team: "/app/equip"
} as const;

export const appNavigation: NavigationItem[] = [
  {
    label: "Inici",
    href: routes.app,
    description: "Estat de jornada i accio principal"
  },
  {
    label: "Historial",
    href: routes.history,
    description: "Consulta de jornades i incidencies"
  },
  {
    label: "Informes",
    href: routes.reports,
    description: "Resums i exportacions futures"
  },
  {
    label: "Perfil",
    href: routes.profile,
    description: "Dades personals i preferencies"
  }
];
