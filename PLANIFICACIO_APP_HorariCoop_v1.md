# Planificacio de l'app HorariCoop

## 1. Objectiu de producte

HorariCoop ha de ser una aplicacio web responsive, mobile-first i legalment robusta per registrar la jornada laboral del personal d'una escola cooperativa, reduint friccio en el fitxatge diari i facilitant el control, la supervisio i l'exportacio d'informes.

Objectius prioritaris:

- fitxatge d'entrada i sortida en 2 clics o menys
- calcul automatic d'hores netes i pauses
- consulta clara del resum diari, setmanal i mensual
- control de rols i permisos amb RLS a Supabase
- traçabilitat completa de qualsevol correccio o incidencia

## 2. Principis de producte

- Mobile-first: la jornada s'ha de poder iniciar i tancar des del mobil sense perdua de claredat.
- Una accio principal per pantalla: sempre hi ha una CTA dominant.
- Estat visible: l'usuari ha de saber en menys de 1 segon si la jornada esta inactiva, activa, en pausa o finalitzada.
- Feedback immediat: confirmacio visual instantania i, si es vol, senyal sonora discreta.
- Compliment normatiu per defecte: auditories, conservacio, geolocalitzacio amb consentiment i historics inalterables.
- Accessibilitat real: contrast AA, navegacio per teclat, labels clars i llenguatge senzill.

## 3. Rols i permisos

### Cooperativista
- iniciar i finalitzar jornada
- iniciar i tancar pauses
- consultar historial propi i informes propis
- gestionar preferencies personals

### Coordinador/a
- tot el que pot fer un cooperativista
- veure registres del seu equip
- validar incidencies
- editar fitxatges amb justificacio
- generar informes d'equip

### Administrador/a
- acces complet
- CRUD d'usuaris
- configuracio de rols, calendari, festius i limits
- configuracio de notificacions, geofencing i opcions d'autenticacio
- auditoria global i exportacions corporatives

## 4. Arquitectura funcional de l'app

### Bloc 1. Autenticacio i acces
- login amb email/contrasenya
- invitacio d'alta via admin
- recuperacio de contrasenya
- gestio de sessio i dispositius de confiança

### Bloc 2. Fitxatge
- iniciar jornada
- finalitzar jornada
- iniciar pausa
- finalitzar pausa
- captura GPS opcional
- resum de jornada en tancar

### Bloc 3. Seguiment personal
- dashboard del dia
- resum setmanal
- calendari mensual
- historial filtrable

### Bloc 4. Informes
- informes per dia, setmana, mes, trimestre i rang personalitzat
- grafic d'hores per dia
- distribucio de pauses
- exportacio PDF i CSV

### Bloc 5. Supervisio i administracio
- usuaris i rols
- incidencies i correccions
- calendari laboral
- configuracio general
- auditoria

### Bloc 6. Alertes i notificacions
- oblit de sortida
- excés d'hores
- resum setmanal per correu
- notificacions de correccio de fitxatge

## 5. Mapa de pantalles

### Zona publica
- `/login`
- `/activar-compte`
- `/recuperar-contrasenya`
- `/restablir-contrasenya`

### Zona usuari
- `/app` Dashboard
- `/app/historial`
- `/app/informes`
- `/app/perfil`

### Zona coordinacio
- `/app/equip`
- `/app/equip/incidencies`
- `/app/equip/informes`

### Zona admin
- `/app/admin/usuaris`
- `/app/admin/registres`
- `/app/admin/informes`
- `/app/admin/calendari`
- `/app/admin/configuracio`
- `/app/admin/auditoria`

## 6. Fluxos clau

### Flux 1. Inici de jornada
1. L'usuari entra al dashboard.
2. Veu l'estat actual i la CTA principal `Iniciar jornada`.
3. Dona consentiment GPS si escau.
4. El sistema registra hora, usuari i coordenades opcionals.
5. Es mostra confirmacio i el dashboard passa a mode jornada activa.

### Flux 2. Pausa
1. Durant la jornada activa, l'usuari prem `Iniciar pausa`.
2. Selecciona categoria.
3. La UI canvia a estat `pausa activa`.
4. En acabar, prem `Finalitzar pausa`.
5. El sistema recalcula el resum net.

### Flux 3. Final de jornada
1. L'usuari prem `Finalitzar jornada`.
2. El sistema mostra un resum previ: temps brut, pauses i hores netes.
3. L'usuari confirma.
4. Es desa el registre i es mostra l'estat `jornada finalitzada`.

### Flux 4. Correccio administrativa
1. Coordinador o admin obre un registre.
2. Edita els camps necessaris.
3. Introdueix justificacio obligatoria.
4. El sistema desa la nova versio i escriu l'auditoria immutable.
5. El treballador rep notificacio.

## 7. Prioritzacio de producte

### MVP real
- autenticacio basica amb invitacio admin
- dashboard amb inici/final de jornada
- pauses amb una sola pausa activa alhora
- resum diari i vista setmanal
- historial personal
- gestio d'usuaris basica per admin
- auditoria de correccions

### Fase 2
- vista mensual
- informes amb grafics
- exportacio CSV i PDF
- calendari laboral i festius

### Fase 3
- geolocalitzacio amb mapa
- geofencing configurable
- alertes per correu
- resum setmanal automatic

### Fase 4
- internacionalitzacio CA/ES i EN opcional
- mode offline parcial
- Google OAuth configurable
- millores de reporting i explotacio de dades

## 8. Arquitectura tecnica proposada

### Frontend
- Next.js 14+ amb App Router
- TypeScript estricte
- Tailwind CSS + shadcn/ui com a base de components
- React Hook Form + Zod per formularis i validacions
- TanStack Query per lectures i sincronitzacio amb Supabase
- Recharts per informes
- Leaflet + OpenStreetMap per mapa de geolocalitzacio

### Backend i plataforma
- Supabase Auth per autenticacio
- PostgreSQL a Supabase per dades principals
- RLS a totes les taules
- Edge Functions per alertes, emails, exportacions i tasques programades
- Storage per avatars, logos i exports generats

### Desplegament
- Vercel per frontend
- Supabase cloud per backend
- GitHub Actions per CI/CD

## 9. Arquitectura de codi recomanada

```text
src/
  app/
    (public)/
    (protected)/
    api/
  components/
    ui/
    layout/
    time-tracking/
    reports/
    admin/
  features/
    auth/
    dashboard/
    time-entries/
    breaks/
    reports/
    users/
    settings/
    audit/
  lib/
    supabase/
    auth/
    utils/
    validations/
    constants/
  server/
    services/
    repositories/
    policies/
  types/
```

Decisions estructurals:

- separar components UI dels moduls de negoci
- centralitzar les regles de permisos en `policies`
- encapsular l'acces a dades en `repositories/services`
- definir tipus compartits per perfils, entrades, pauses, informes i auditories

## 10. Model de dades base i ampliacions recomanades

L'SRS cobreix `profiles`, `time_entries`, `breaks` i `audit_log`. Per tancar totes les funcionalitats cal afegir:

### `holidays`
- data
- nom
- ambit: nacional, autonomic, centre
- tipus: festiu, tancament, vacances

### `work_calendars`
- id
- nom calendari
- hores per dia per defecte
- dies laborables
- assignable a usuaris o departaments

### `user_notification_preferences`
- user_id
- avis sortida pendent
- resum setmanal
- notificacions de correccio

### `system_settings`
- limit jornada ordinaria
- limit hores extra
- pausa minima
- geofencing activat
- radi permis
- Google OAuth activat

### `teams` i `team_members`
- necessaries si coordinadors han de veure equips concrets i no tot el personal

### `report_exports`
- historic de PDF/CSV generats
- filtre aplicat
- generat per
- URL temporal o referencia d'emmagatzematge

## 11. Seguretat i compliment des del disseny

- RLS per limitar visibilitat per usuari, equip i rol
- cap cooperativista pot modificar registres tancats
- totes les correccions passen per justificacio + auditoria
- retencio minima de 4 anys configurada a nivell de dades i backups
- consentiment GPS explicit i revocable
- registre d'acceptacio de clausules informatives en l'alta
- logs d'accio critica des de backend, no nomes des del client

## 12. Direccio UX/UI per a la versio inicial

No he trobat cap export local de la proposta de Stitch AI `controlhorari`, aixi que la planificacio visual queda ancorada a l'SRS i a un patró de dashboard de fitxatge molt orientat a us quotidià.

### Layout
- desktop amb sidebar esquerra i capçalera compacta
- mobil amb capçalera simple i navegacio inferior de 4 accessos: Inici, Historial, Informes, Perfil
- CTA principal sempre visible a la part superior del dashboard

### Jerarquia visual
- targeta central gran amb l'estat de la jornada
- cronologia del dia just a sota: entrada, pauses, sortida
- resum setmanal en targetes o mini-grafic
- incidencies i alertes en un bloc separat de color semantic

### Llenguatge visual
- estètica neta i institucional, no corporativa rigida
- colors semantics definits al SRS: verd, taronja, gris i vermell
- base neutra clara amb molt contrast i espais amplis
- icones simples, text directe i CTA molt marcada

### Components clau
- targeta d'estat de jornada
- boto d'accio primari gran
- timeline de pauses
- taula setmanal responsive
- calendari mensual amb codi de colors
- modal de correccio amb justificacio obligatoria

## 13. Roadmap recomanat per sprints

### Sprint 0 - Descoberta i definicio
- validar branding i patron visual final
- tancar mapa de rols i equips
- definir taules finals i RLS
- preparar wireframes i prototip funcional

### Sprint 1 - Base tecnica
- bootstrap Next.js + Supabase + auth
- layout public i privat
- model `profiles`
- seeds i entorns

### Sprint 2 - Fitxatge MVP
- `time_entries`
- iniciar i finalitzar jornada
- dashboard de dia
- historial basic

### Sprint 3 - Pauses i calculs
- `breaks`
- pauses categoritzades
- calcul d'hores netes
- estat de jornada en temps real

### Sprint 4 - Supervisio
- permisos per coordinador i admin
- correccions amb justificacio
- `audit_log`
- vista de registres de l'equip

### Sprint 5 - Informes
- vista setmanal i mensual
- grafics
- exportacio CSV
- base PDF

### Sprint 6 - Administracio
- CRUD d'usuaris
- calendari laboral
- festius i configuracions generals

### Sprint 7 - GPS i notificacions
- geolocalitzacio
- mapa de detall
- alertes per oblit i excés d'hores

### Sprint 8 - Qualitat i llançament
- testos E2E, accessibilitat i rendiment
- revisio legal i de seguretat
- documentacio i desplegament

## 14. Definicio de done per fase

Una fase no es considera tancada fins que compleix:

- tests unitaris i d'integracio del modul verds
- validacions de permisos aprovades
- Lighthouse > 85 en pantalles critiques
- verificacio responsive mobil i desktop
- auditabilitat funcional si el modul toca dades laborals
- copy en catala llest per localitzar a castella

## 15. Decisions de planificacio que recomano ara

- començar amb un MVP fort de fitxatge i seguiment personal abans de sofisticar informes
- modelar equips des del principi encara que el primer lliurament sigui senzill
- resoldre RLS abans de construir administracio per evitar refactors
- deixar Google OAuth com a extensio configurable, no com a dependencia inicial
- preparar el sistema per CA i ES des del primer sprint encara que el segon idioma arribi mes tard

## 16. Propera passa util

Amb aquesta base, el seguent entregable logic es un paquet de:

1. sitemap definitiu
2. wireframes de les pantalles principals
3. esquema SQL inicial de Supabase
4. backlog prioritzat per sprints
