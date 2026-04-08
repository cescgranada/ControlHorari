# Backlog MVP HorariCoop v1

## 1. Objectiu del backlog

Aquest backlog transforma la planificacio funcional i tecnica en un pla executable per construir el MVP de HorariCoop. El focus es lliurar una primera versio usable, segura i auditada per al control de jornada del personal.

## 2. Abast del MVP

Inclou:

- autenticacio amb email i contrasenya
- alta d'usuaris per administracio
- dashboard personal amb inici i final de jornada
- pauses amb categories i una sola pausa activa
- historial personal i resum setmanal
- gestio basica d'usuaris per admin
- correccions de fitxatges amb justificacio
- auditoria base
- RLS, permisos i qualitat minima per produccio pilot

Queda fora del MVP:

- exportacio PDF final
- informes avancats multi-equip
- mapa complet de geolocalitzacio
- geofencing actiu
- Google OAuth
- mode offline parcial

## 3. Epics del MVP

- E01. Fonaments tecnics
- E02. Autenticacio i perfils
- E03. Fitxatge de jornada
- E04. Gestio de pauses
- E05. Dashboard, historial i resum
- E06. Administracio i correccions
- E07. Seguretat, auditoria i permisos
- E08. Qualitat, proves i desplegament pilot

## 4. Criteris de prioritat

- P0: imprescindible per obrir el pilot
- P1: molt important per una experiencia completa de MVP
- P2: millora util, pot entrar al final del MVP si hi ha marge

## 5. Backlog detallat

| ID | Epic | Item | Tipus | Prioritat | Estimacio | Dependencia | Acceptacio resumida |
| --- | --- | --- | --- | --- | --- | --- | --- |
| MVP-001 | E01 | Inicialitzar projecte Next.js amb TypeScript, App Router i estructura base | Tecnic | P0 | 3 | cap | App arrenca en local amb layout public i privat |
| MVP-002 | E01 | Configurar Tailwind, llibreria UI base i sistema de tokens visuals | Tecnic | P1 | 2 | MVP-001 | Components base disponibles i tema coherent |
| MVP-003 | E01 | Configurar entorns, variables i client/server helpers de Supabase | Tecnic | P0 | 2 | MVP-001 | Connexio a Supabase separada per client i server |
| MVP-004 | E01 | Crear estructura modular de features, services, repositories i validations | Tecnic | P1 | 2 | MVP-001 | Codi organitzat segons arquitectura definida |
| MVP-005 | E01 | Configurar lint, format i convencions de commits internes | Tecnic | P1 | 1 | MVP-001 | Validacions locals disponibles |
| MVP-006 | E02 | Implementar pantalla de login | Usuari | P0 | 2 | MVP-003 | Usuari pot autenticar-se amb email i contrasenya |
| MVP-007 | E02 | Implementar flux de recuperar i restablir contrasenya | Usuari | P1 | 2 | MVP-006 | Enviament i consum del token funcionals |
| MVP-008 | E02 | Protegir rutes i redirigir segons sessio | Tecnic | P0 | 2 | MVP-006 | Rutes privades no accessibles sense sessio |
| MVP-009 | E02 | Crear pantalla de perfil amb dades basiques i preferencies | Usuari | P1 | 2 | MVP-008 | Usuari veu i edita el que te permes |
| MVP-010 | E02 | Sincronitzar `profiles` i `user_notification_preferences` amb `auth.users` | Tecnic | P0 | 2 | MVP-003 | Nou usuari autenticat genera perfil usable |
| MVP-011 | E02 | Definir middleware o guardes de rol a la capa d'app | Tecnic | P0 | 2 | MVP-008 | Rol condiciona acces a zones de coordinacio i admin |
| MVP-012 | E03 | Implementar estat actual de jornada al dashboard | Usuari | P0 | 3 | MVP-008, MVP-024 | Usuari veu si la jornada esta no iniciada, activa o tancada |
| MVP-013 | E03 | Implementar accio `Iniciar jornada` | Usuari | P0 | 3 | MVP-024 | Crea `time_entry` activa en menys de 2 interaccions |
| MVP-014 | E03 | Implementar accio `Finalitzar jornada` amb confirmacio | Usuari | P0 | 3 | MVP-013 | Tanca la jornada i mostra resum provisional |
| MVP-015 | E03 | Mostrar cronologia del dia i comptador de jornada activa | Usuari | P1 | 3 | MVP-012 | Timeline del dia i temps acumulat visibles |
| MVP-016 | E03 | Permetre notes de jornada en registre propi | Usuari | P2 | 1 | MVP-014 | Usuari pot afegir o editar nota en els casos permesos |
| MVP-017 | E04 | Implementar inici de pausa amb seleccio de categoria | Usuari | P0 | 3 | MVP-013, MVP-025 | Nomes hi pot haver una pausa activa |
| MVP-018 | E04 | Implementar finalitzacio de pausa activa | Usuari | P0 | 2 | MVP-017 | La pausa es tanca correctament i la UI es refresca |
| MVP-019 | E04 | Mostrar estat `pausa activa` i temporitzador independent | Usuari | P1 | 2 | MVP-017 | El dashboard canvia visualment en pausa |
| MVP-020 | E04 | Calcular temps brut, pauses i temps net del dia | Tecnic | P0 | 3 | MVP-017, MVP-018 | Calcul coherent a dashboard i historial |
| MVP-021 | E05 | Construir dashboard responsive mobile-first | Usuari | P0 | 3 | MVP-012, MVP-015, MVP-019 | La CTA principal queda visible en mobil i desktop |
| MVP-022 | E05 | Implementar vista d'historial personal amb filtre per dates | Usuari | P1 | 3 | MVP-014, MVP-020 | Usuari consulta jornades passades amb paginacio o llistat |
| MVP-023 | E05 | Implementar detall de jornada amb pauses i incidencies | Usuari | P1 | 2 | MVP-022 | Cada registre mostra detall complet |
| MVP-024 | E07 | Aplicar migracio inicial de Supabase i taules base | Tecnic | P0 | 3 | MVP-003 | Esquema desplegat sense errors |
| MVP-025 | E07 | Aplicar RLS, helper functions i politiques de permisos | Tecnic | P0 | 3 | MVP-024 | Acces restringit per rol i equip |
| MVP-026 | E07 | Implementar capa de consultes/repositoris per `time_entries` i `breaks` | Tecnic | P0 | 3 | MVP-024 | El frontend no accedeix directament a logica dispersa |
| MVP-027 | E07 | Implementar auditories automatiques en canvis critics | Tecnic | P0 | 2 | MVP-024 | Correccions i canvis rellevants queden registrats |
| MVP-028 | E05 | Implementar resum setmanal al dashboard | Usuari | P1 | 3 | MVP-020 | Usuari veu hores acumulades vs contracte |
| MVP-029 | E05 | Mostrar indicadors d'incidencia per dies incomplets o irregulars | Usuari | P1 | 2 | MVP-022, MVP-028 | Dies amb problemes queden destacats |
| MVP-030 | E06 | Crear llistat admin d'usuaris amb filtre per rol i estat | Usuari | P0 | 3 | MVP-011, MVP-024 | Admin veu i filtra personal |
| MVP-031 | E06 | Crear formulari d'alta d'usuari des d'administracio | Usuari | P0 | 3 | MVP-030 | Admin pot donar d'alta usuari i assignar rol |
| MVP-032 | E06 | Implementar edicio d'usuari: rol, departament, hores setmanals, activacio | Usuari | P0 | 3 | MVP-031 | Canvis persisteixen i respecten permisos |
| MVP-033 | E06 | Crear pantalla admin de registres amb cerca per usuari i data | Usuari | P0 | 3 | MVP-025, MVP-026 | Admin localitza qualsevol jornada |
| MVP-034 | E06 | Permetre correccio de fitxatge amb justificacio obligatoria | Usuari | P0 | 3 | MVP-033, MVP-027 | No es pot desar una correccio sense motiu |
| MVP-035 | E06 | Mostrar historial basic d'auditoria al detall del registre | Usuari | P1 | 2 | MVP-034 | Es veu qui ha canviat que i quan |
| MVP-036 | E06 | Preparar vista de coordinacio d'equip amb permisos limitats | Usuari | P1 | 3 | MVP-025, MVP-033 | Coordinador veu nomes el seu equip |
| MVP-037 | E06 | Modelar equips i assignacio basica de membres | Tecnic | P1 | 2 | MVP-024 | Hi ha relacio operativa entre coordinador i equip |
| MVP-038 | E05 | Preparar esquelet de pantalla d'informes MVP sense exportacio final | Usuari | P2 | 2 | MVP-028 | Hi ha vista basica de resum, encara que simple |
| MVP-039 | E08 | Configurar tests unitaris amb Vitest | Tecnic | P0 | 2 | MVP-001 | Infra de tests funcional |
| MVP-040 | E08 | Cobrir logica de calcul d'hores i pauses amb tests | Tecnic | P0 | 3 | MVP-020, MVP-039 | Casos normals i limits coberts |
| MVP-041 | E08 | Cobrir fluxos principals amb E2E: login, iniciar jornada, pausa, finalitzar jornada | Tecnic | P0 | 3 | MVP-014, MVP-018 | Happy paths automatitzats |
| MVP-042 | E08 | Validar responsive i accessibilitat de pantalles critiques | Tecnic | P0 | 2 | MVP-021, MVP-022, MVP-030 | Sense errors critics WCAG en pantalles clau |
| MVP-043 | E08 | Configurar pipeline CI basica per lint, test i build | Tecnic | P1 | 2 | MVP-039 | Cada PR valida qualitat minima |
| MVP-044 | E08 | Preparar entorn pilot i check-list de llançament | Tecnic | P1 | 2 | MVP-041, MVP-043 | Build desplegable i validada per pilot |

## 6. Backlog per sprints

## Sprint 0 - Base de projecte

Objectiu: tenir la base tecnica i visual preparada per construir funcionalitat.

- MVP-001
- MVP-002
- MVP-003
- MVP-004
- MVP-005
- MVP-039

Resultat esperat:
- projecte arrencat, estructura definida, connexio a Supabase preparada i entorn de desenvolupament estable

## Sprint 1 - Autenticacio i accessos

Objectiu: entrar al sistema i accedir a zones correctes segons rol.

- MVP-006
- MVP-007
- MVP-008
- MVP-009
- MVP-010
- MVP-011

Resultat esperat:
- login funcional, rutes protegides i primer perfil usable

## Sprint 2 - Fitxatge basico-operatiu

Objectiu: poder iniciar i finalitzar jornada amb una experiencia real de treball.

- MVP-024
- MVP-025
- MVP-026
- MVP-012
- MVP-013
- MVP-014
- MVP-015
- MVP-021

Resultat esperat:
- el treballador pot fitxar entrada i sortida i veure l'estat de la jornada

## Sprint 3 - Pauses i calcul de temps

Objectiu: completar la logica de jornada neta.

- MVP-017
- MVP-018
- MVP-019
- MVP-020
- MVP-016
- MVP-040

Resultat esperat:
- pauses operatives i calcul fiable de temps brut, pauses i hores netes

## Sprint 4 - Historial i seguiment personal

Objectiu: donar autonomia a l'usuari per consultar el seu registre.

- MVP-022
- MVP-023
- MVP-028
- MVP-029
- MVP-038

Resultat esperat:
- historial consultable, resum setmanal i visibilitat d'incidencies

## Sprint 5 - Administracio i correccions

Objectiu: permetre alta de personal i supervisio operativa.

- MVP-027
- MVP-030
- MVP-031
- MVP-032
- MVP-033
- MVP-034
- MVP-035
- MVP-037
- MVP-036

Resultat esperat:
- admin pot gestionar usuaris i corregir registres; coordinacio veu el seu ambit

## Sprint 6 - Qualitat i llançament pilot

Objectiu: assegurar una versio prou robusta per sortir a pilot.

- MVP-041
- MVP-042
- MVP-043
- MVP-044

Resultat esperat:
- build estable, tests essencials, CI basica i check-list de pilot completada

## 7. Histories critiques amb criteris d'acceptacio ampliats

### HU-01 - Iniciar jornada
Com a cooperativista, vull iniciar la meva jornada amb un toc principal per registrar l'entrada de forma rapida.

Criteris:
- si no hi ha jornada activa, la CTA `Iniciar jornada` es mostra destacada
- en activar-la, es crea un registre amb `clock_in`
- no es permet una segona entrada si la jornada segueix oberta
- la UI mostra confirmacio immediata i canvia a estat `jornada activa`

### HU-02 - Finalitzar jornada
Com a cooperativista, vull tancar la jornada per deixar el dia registrat amb el resum corresponent.

Criteris:
- nomes es pot finalitzar si hi ha una jornada activa
- si hi ha una pausa activa, el sistema obliga a tancar-la o la bloqueja segons regla definida
- abans de confirmar, es mostra resum de temps brut, pauses i temps net
- en desar, la jornada queda tancada i no editable pel treballador

### HU-03 - Iniciar i finalitzar pausa
Com a cooperativista, vull registrar pauses perque es descomptin del temps net treballat.

Criteris:
- nomes es pot iniciar pausa si la jornada esta activa
- nomes hi pot haver una pausa activa alhora
- en iniciar-la cal triar categoria
- en tancar-la, el resum del dia s'actualitza correctament

### HU-04 - Corregir registre
Com a admin o coordinador/a, vull corregir fitxatges d'un usuari amb justificacio per mantenir la fiabilitat legal.

Criteris:
- nomes rols autoritzats poden accedir a l'accio de correccio
- `edit_reason` es obligatori
- la modificacio actualitza el registre i queda anotada a `audit_log`
- el detall del registre mostra que hi ha hagut una correccio

### HU-05 - Consultar historial personal
Com a cooperativista, vull consultar el meu historial per revisar dies treballats i incidencies.

Criteris:
- es poden filtrar dates
- cada fila mostra entrada, sortida, temps net i estat
- es pot obrir el detall per veure pauses i observacions
- l'usuari no veu registres d'altres persones

## 8. Dependencies critiques

- no es comenca el frontend real de fitxatge sense `MVP-024` i `MVP-025`
- no es fa administracio sense rols i guardes de navegacio estables
- no es dona per bona la logica de jornada sense `MVP-040`
- no es passa a pilot sense `MVP-041` i `MVP-042`

## 9. Definicio de ready

Un item entra a sprint si:

- te objectiu clar i resultat observable
- te dependencia identificada
- te criteri d'acceptacio minim
- hi ha disseny suficient per executar-lo

## 10. Definicio de done

Un item es considera acabat quan:

- el codi esta integrat sense errors de build
- les validacions i permisos corresponents estan coberts
- hi ha prova manual o automatica del cas principal
- s'ha verificat en mobil i desktop si te impacte visual
- no introdueix regressions en fluxos de fitxatge

## 11. Ordre recomanat d'execucio immediat

Si comencem avui mateix, l'ordre mes eficient es:

1. `MVP-001` a `MVP-005`
2. `MVP-024` a `MVP-026`
3. `MVP-006`, `MVP-008`, `MVP-011`
4. `MVP-012` a `MVP-015`
5. `MVP-017` a `MVP-020`

Amb aquest paquet ja tindrem el nucli real del producte funcionant.
