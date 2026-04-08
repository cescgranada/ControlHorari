



**DOCUMENT D'ESPECIFICACIONS**

**DE REQUERIMENTS (SRS)**



**Aplicació de Control i Gestió Horari**

per a Escola Cooperativa





|**Versió:**|1\.0|
| :- | :- |
|**Data:**|Març 2026|
|**Estat:**|Esborrany inicial|
|**Classificació:**|Intern / Confidencial|

SRS — Aplicació de Control Horari  |  Escola Cooperativa     v1.0 · 2026
# **1. Introducció**
## **1.1 Propòsit**
Aquest document descriu els requeriments funcionals i no funcionals de l'Aplicació de Control i Gestió Horari per a una Escola Cooperativa. L'objectiu és proporcionar una base clara i completa per al disseny, desenvolupament, proves i validació del sistema.

El document segueix l'estàndard IEEE 830 per a l'especificació de requeriments de programari (SRS) i cobreix tots els aspectes del sistema, des de la interfície d'usuari fins a la infraestructura tècnica.

## **1.2 Abast del projecte**
L'aplicació, denominada HorariCoop, és una eina web moderna per al control i la gestió dels horaris laborals del personal d'una escola cooperativa. Permet:

- Registrar entrades i sortides de la jornada laboral.
- Gestionar pauses (esmorzar, dinar, altres descansos).
- Geolocalitzar el punt d'inici i final de la jornada.
- Calcular automàticament hores treballades i descansos.
- Generar informes visuals del temps treballat per dia, setmana i mes.
- Administrar usuaris, rols i permisos.

## **1.3 Definicions, acrònims i abreviatures**

|**Terme**|**Definició**|
| :-: | :-: |
|SRS|Software Requirements Specification — Document d'Especificació de Requeriments|
|SPA|Single Page Application — Aplicació d'una sola pàgina|
|API REST|Application Programming Interface de tipus RESTful|
|Supabase|Plataforma BaaS (Backend as a Service) basada en PostgreSQL|
|JWT|JSON Web Token — mecanisme d'autenticació i autorització|
|RLS|Row Level Security — seguretat a nivell de fila a PostgreSQL/Supabase|
|GPS|Global Positioning System — sistema de geolocalització|
|HorariCoop|Nom intern de l'aplicació de control horari|
|Admin|Rol d'administrador del sistema|
|Cooperativista|Treballador/a soci/a de l'escola cooperativa|

## **1.4 Referències**
- IEEE Std 830-1998: Guia per a l'especificació de requeriments de programari.
- Llei 10/2019, de 8 de febrer — control de jornada laboral a Espanya (art. 34.9 ET).
- Reglament General de Protecció de Dades (RGPD) — Reglament (UE) 2016/679.
- Supabase Documentation: https://supabase.com/docs
- WCAG 2.1 — Web Content Accessibility Guidelines.

## **1.5 Visió general del document**
El document s'estructura de la manera següent:

1. Secció 1 — Introducció i context del projecte.
1. Secció 2 — Descripció general del sistema.
1. Secció 3 — Requeriments funcionals detallats.
1. Secció 4 — Requeriments no funcionals.
1. Secció 5 — Arquitectura i stack tecnològic.
1. Secció 6 — Model de dades (Supabase/PostgreSQL).
1. Secció 7 — Interfície d'usuari i experiència.
1. Secció 8 — Seguretat i compliment legal.
1. Secció 9 — Proves i criteris d'acceptació.
1. Secció 10 — Planificació i fases del projecte.
1. Secció 11 — Riscos i mitigació.


# **2. Descripció General del Sistema**
## **2.1 Perspectiva del producte**
HorariCoop és una aplicació web autònoma, accessible des de qualsevol dispositiu modern (ordinador, tauleta, mòbil) sense necessitat d'instal·lació. S'integra amb Supabase com a backend complet: base de dades PostgreSQL, autenticació, emmagatzematge i APIs en temps real.

L'aplicació substitueix els registres manuals en paper o fulls de càlcul, oferint un sistema centralitzat, segur i auditabler que compleix la normativa laboral espanyola sobre control de jornada.

## **2.2 Funcions principals del producte**

|**Funció**|**Descripció**|
| :-: | :-: |
|Fitxatge digital|Registre d'entrada i sortida amb un clic, amb marca de temps i geolocalització.|
|Gestió de pauses|Inici i fi de pauses categoritzades (esmorzar, dinar, personal) amb còmput automàtic.|
|Panell personal|Vista diària, setmanal i mensual del propi registre de jornada.|
|Informes i exportació|Generació de rapports visuals i exportació a PDF/CSV.|
|Administració|Gestió de personal, rol, calendari laboral i festius.|
|Geolocalització|Captura de coordenades GPS en el moment del fitxatge.|
|Alertes automàtiques|Notificació d'oblit de fitxatge de sortida o excés d'hores.|

## **2.3 Classes i característiques dels usuaris**
### **2.3.1 Cooperativista (Treballador/a)**
- Registra la seva pròpia jornada laboral.
- Consulta el seu historial i resum d'hores.
- Pot exportar els seus propis informes.
- No té accés a dades d'altres treballadors.

### **2.3.2 Coordinador/a (Supervisor)**
- Accés de lectura als registres del seu equip.
- Pot validar o marcar incidències en fitxatges.
- Genera informes del seu equip.
- Pot editar fitxatges amb justificació.

### **2.3.3 Administrador/a**
- Accés complet al sistema.
- Gestió d'usuaris, rols i configuració.
- Definició de calendari laboral i festius.
- Supervisió de tots els registres i generació de qualsevol informe.
- Configuració de paràmetres del sistema (hores màximes, pauses mínimes, etc.).

## **2.4 Restriccions generals**
- L'aplicació ha de funcionar en navegadors moderns (Chrome 110+, Firefox 110+, Safari 16+, Edge 110+).
- Ha de ser completament responsive i usable en pantalles de 320px d'amplada mínima.
- El registre de geolocalització requereix el consentiment explícit de l'usuari.
- Ha de complir el RGPD i la LOPDGDD.
- Les dades de jornada han de conservar-se com a mínim 4 anys (obligació legal).

## **2.5 Suposicions i dependències**
- Els treballadors disposen d'un dispositiu amb connexió a Internet per fitxar.
- Supabase estarà disponible com a servei cloud (SLA 99.9%).
- L'escola disposa d'un domini propi per allotjar l'aplicació.
- Es disposarà d'un compte Supabase (pla Pro recomanat per entorns de producció).


# **3. Requeriments Funcionals**
## **3.1 Mòdul d'autenticació i seguretat**
### **RF-01 — Registre i alta d'usuaris**
- El sistema permetrà l'alta de nous usuaris únicament per part de l'administrador.
- L'usuari rebrà un correu d'invitació amb un enllaç d'activació temporal (72h de validesa).
- En la primera entrada, l'usuari haurà d'establir la seva contrasenya.

### **RF-02 — Inici de sessió**
- Autenticació mitjançant correu electrònic i contrasenya gestionada per Supabase Auth.
- Opció d'autenticació amb Google OAuth (opcional, configurable per l'administrador).
- Sessió persistent configurable (per defecte 8 hores en dispositius desconeguts, 30 dies en dispositius de confiança).
- Bloqueig temporal de compte després de 5 intents fallits (15 minuts).

### **RF-03 — Recuperació de contrasenya**
- Flux de recuperació per correu electrònic amb token d'un sol ús i caducitat de 1 hora.

### **RF-04 — Tancament de sessió**
- L'usuari pot tancar sessió manualment des de qualsevol pàgina.
- Tancament automàtic de sessió per inactivitat (configurable, per defecte 4 hores).

## **3.2 Mòdul de fitxatge**
### **RF-05 — Registre d'entrada**
- Botó destacat 'Iniciar jornada' visible a la pantalla principal.
- El sistema registra automàticament: data, hora (UTC i local), identificador d'usuari.
- Si la geolocalització és activa, es capturen coordenades GPS (latitud, longitud, precisió en metres).
- Es mostra confirmació visual i sonora (opcional) del registre exitós.
- No es permet doble registre d'entrada sense haver registrat prèviament la sortida.

### **RF-06 — Registre de sortida**
- Botó 'Finalitzar jornada' disponible quan hi ha una entrada activa.
- El sistema calcula i mostra el resum de la jornada (hores totals, pauses, hores netes).
- Es capturen coordenades GPS de sortida (si el permís és actiu).
- Es demana confirmació a l'usuari abans de registrar la sortida.

### **RF-07 — Gestió de pauses**
- L'usuari pot iniciar una pausa durant la jornada activa.
- Categories de pausa disponibles: Esmorzar, Dinar, Pausa personal, Reunió externa.
- El sistema registra inici i fi de cada pausa.
- Es calculen automàticament les hores de pausa i es descompten de les hores netes.
- Es pot tenir com a màxim una pausa activa alhora.

### **RF-08 — Geolocalització**
- En el primer ús, el sistema sol·licita permís de geolocalització a l'usuari.
- Si el permís és denegat, el fitxatge es pot fer igualment sense coordenades.
- Les coordenades es mostren en un mapa interactiu (OpenStreetMap/Leaflet) al detall del registre.
- L'administrador pot configurar un radi màxim permès d'entrada (geofencing opcional).

### **RF-09 — Correcció de fitxatges**
- Els coordinadors i administradors poden editar o afegir fitxatges amb justificació obligatòria.
- Qualsevol modificació queda registrada en un log d'auditoria (qui, quan, què).
- El treballador afectat rep una notificació de la correcció.

## **3.3 Mòdul de panell personal**
### **RF-10 — Vista diària**
- Mostra el registre del dia actual: entrada, pauses i sortida amb les hores corresponents.
- Indicador visual d'estat (jornada no iniciada / activa / finalitzada).
- Resum de les hores treballades netes i les pauses del dia.

### **RF-11 — Vista setmanal**
- Taula resum dels 7 dies de la setmana actual o qualsevol setmana seleccionable.
- Hores per dia, total de la setmana i comparació amb la jornada contractual.
- Indicació visual de dies amb incidències (absència, hores insuficients, etc.).

### **RF-12 — Vista mensual**
- Calendari mensual amb codificació de colors per estat de cada dia.
- Resum mensual: total hores, dies treballats, dies absència, hores extres.

## **3.4 Mòdul d'informes**
### **RF-13 — Generació d'informes**
- Informes disponibles per a períodes: dia, setmana, mes, trimestre i rang personalitzat.
- Visualitzacions gràfiques: gràfic de barres (hores per dia), gràfic circular (distribució pauses).
- Informe de resum per treballador (accessible per l'administrador).

### **RF-14 — Exportació**
- Exportació d'informes en format PDF (amb logo de l'escola i capçalera corporativa).
- Exportació en format CSV per a tractament extern (nòmines, comptabilitat).
- Els informes exportats inclouen: data/hora d'exportació, usuari que l'ha generat i filtre aplicat.

## **3.5 Mòdul d'administració**
### **RF-15 — Gestió d'usuaris**
- CRUD complet: crear, editar, desactivar i eliminar usuaris.
- Assignació de rols (Cooperativista, Coordinador, Administrador).
- Configuració de la jornada contractual per usuari (hores/dia, dies laborals).
- Desactivació temporal sense pèrdua de dades histèriques.

### **RF-16 — Calendari laboral**
- Definició de festius nacionals, autonòmics i propis de l'escola.
- Configuració de períodes especials (vacances, tancaments).
- Importació de calendari en format iCal.

### **RF-17 — Alertes i notificacions**
- Alerta per oblit de fitxatge de sortida (enviament per correu electrònic a les 21:00h si hi ha entrada sense sortida).
- Alerta per jornada superior al límit legal (9h ordinàries + 2h extra).
- Resum setmanal automàtic per correu electrònic (configurable).


# **4. Requeriments No Funcionals**
## **4.1 Rendiment**

|**Paràmetre**|**Requisit**|**Mètrica**|
| :-: | :-: | :-: |
|Temps de càrrega inicial|< 2 segons en connexió 4G|First Contentful Paint|
|Temps de resposta fitxatge|< 500 ms (P95)|Server response time|
|Usuaris concurrents|Mínim 50 simultanis|Load test|
|Disponibilitat|99\.5% mensual (excl. manteniment)|Uptime monitoring|
|Lighthouse Score|> 85 en Performance|Google Lighthouse|

## **4.2 Usabilitat i accessibilitat**
- Interfície responsive amb disseny mobile-first.
- Compliment WCAG 2.1 nivell AA (contrast, mida de font, navegació per teclat).
- L'acció principal (fitxar entrada/sortida) ha de ser realitzable en un màxim de 2 tocs/clics.
- Suport per a les dues llengües oficials a Catalunya: català i castellà. Anglès opcional.
- Mode fosc (dark mode) suportat.

## **4.3 Seguretat**
- Totes les comunicacions mitjançant HTTPS (TLS 1.3 mínim).
- Autenticació gestionada per Supabase Auth (tokens JWT amb caducitat).
- Row Level Security (RLS) activat a totes les taules de Supabase.
- Dades sensibles encriptades en repòs (Supabase encripta per defecte AES-256).
- Registre d'auditoria immutable de totes les accions crítiques.
- Política de contrasenyes: mínim 8 caràcters, majúscula, minúscula i número.

## **4.4 Mantenibilitat i escalabilitat**
- Codi font amb cobertura de tests unitaris mínima del 70%.
- Documentació tècnica inline (JSDoc/TSDoc).
- Arquitectura modular que permeti afegir nous mòduls sense refactoritzar el nucli.
- Pipeline CI/CD automatitzat (GitHub Actions o equivalent).
- Versionatge semàntic (SemVer) del codi.

## **4.5 Portabilitat i compatibilitat**
- Navegadors suportats: Chrome 110+, Firefox 110+, Safari 16+, Edge 110+.
- Sistemes operatius: Windows 10+, macOS 12+, iOS 15+, Android 10+.
- No es requereix cap instal·lació ni plugin addicional.
- Funcionament offline parcial (consulta de l'últim registre guardat en local) desitjable.


# **5. Arquitectura i Stack Tecnològic**
## **5.1 Visió general de l'arquitectura**
HorariCoop segueix una arquitectura de tres capes amb frontend SPA, backend gestionat per Supabase i capa de dades PostgreSQL. La comunicació es realitza via API REST i WebSockets en temps real.

## **5.2 Stack tecnològic recomanat**

|**Capa**|**Tecnologia**|**Justificació**|
| :-: | :-: | :-: |
|Frontend|React 18+ / Next.js 14+|Ecosistema madur, SSR per SEO i rendiment.|
|Estils|Tailwind CSS + shadcn/ui|Velocitat de desenvolupament, components accessibles.|
|Gràfics|Recharts / Chart.js|Lleuger, responsive i altament configurable.|
|Mapes|Leaflet + OpenStreetMap|Gratuït, sense límits d'ús, lliure.|
|Backend|Supabase (PostgreSQL)|BaaS complet: auth, DB, realtime, storage.|
|Autenticació|Supabase Auth + JWT|Integrat, segur, OAuth disponible.|
|Lògica backend|Supabase Edge Functions|Serverless Deno, integrat a l'ecosistema.|
|Emails|Resend / SendGrid|Enviament transaccional fiable.|
|Desplegament|Vercel / Netlify|CDN global, desplegament automàtic.|
|CI/CD|GitHub Actions|Integrat amb repositori, gratuït per projectes petits.|


# **6. Model de Dades (Supabase / PostgreSQL)**
## **6.1 Taules principals**
### **Taula: profiles**
Extensió de la taula auth.users de Supabase. Emmagatzema informació addicional dels usuaris.

|**Columna**|**Tipus**|**Restriccions**|**Descripció**|
| :-: | :-: | :-: | :-: |
|id|UUID|PK, FK auth.users|Identificador únic (referència Supabase Auth).|
|full\_name|TEXT|NOT NULL|Nom complet del treballador.|
|role|ENUM|NOT NULL|Rol: worker | coordinator | admin.|
|weekly\_hours|NUMERIC(5,2)|DEFAULT 37.5|Hores setmanals contractuals.|
|department|TEXT|NULLABLE|Departament o àrea (p.ex. Primària, Administració).|
|avatar\_url|TEXT|NULLABLE|URL de la imatge de perfil (Supabase Storage).|
|is\_active|BOOLEAN|DEFAULT true|Permet desactivar sense eliminar.|
|created\_at|TIMESTAMPTZ|DEFAULT now()|Data d'alta al sistema.|

### **Taula: time\_entries**
Registre principal de fitxatges. Cada fila representa una jornada laboral completa o en curs.

|**Columna**|**Tipus**|**Restriccions**|**Descripció**|
| :-: | :-: | :-: | :-: |
|id|UUID|PK, DEFAULT gen\_random\_uuid()|Identificador únic del registre.|
|user\_id|UUID|FK profiles.id|Treballador al qual pertany el registre.|
|clock\_in|TIMESTAMPTZ|NOT NULL|Marca de temps d'entrada (UTC).|
|clock\_out|TIMESTAMPTZ|NULLABLE|Marca de temps de sortida. NULL si la jornada és activa.|
|clock\_in\_lat|DOUBLE PRECISION|NULLABLE|Latitud GPS en el moment de l'entrada.|
|clock\_in\_lng|DOUBLE PRECISION|NULLABLE|Longitud GPS en el moment de l'entrada.|
|clock\_out\_lat|DOUBLE PRECISION|NULLABLE|Latitud GPS en el moment de la sortida.|
|clock\_out\_lng|DOUBLE PRECISION|NULLABLE|Longitud GPS en el moment de la sortida.|
|notes|TEXT|NULLABLE|Notes opcionals del treballador per a la jornada.|
|is\_manual|BOOLEAN|DEFAULT false|TRUE si el registre ha estat creat o modificat manualment.|
|edited\_by|UUID|FK profiles.id, NULLABLE|Administrador que ha editat el registre.|
|edit\_reason|TEXT|NULLABLE|Justificació obligatòria en cas d'edició.|

### **Taula: breaks**
Registre de les pauses realitzades dins d'una jornada laboral.

|**Columna**|**Tipus**|**Restriccions**|**Descripció**|
| :-: | :-: | :-: | :-: |
|id|UUID|PK|Identificador únic de la pausa.|
|entry\_id|UUID|FK time\_entries.id|Jornada a la qual pertany la pausa.|
|break\_type|ENUM|NOT NULL|Tipus: breakfast | lunch | personal | meeting.|
|started\_at|TIMESTAMPTZ|NOT NULL|Inici de la pausa.|
|ended\_at|TIMESTAMPTZ|NULLABLE|Fi de la pausa. NULL si la pausa és activa.|

### **Taula: audit\_log**
Registre d'auditoria immutable de totes les accions crítiques del sistema.

|**Columna**|**Tipus**|**Restriccions**|**Descripció**|
| :-: | :-: | :-: | :-: |
|id|BIGSERIAL|PK|Identificador seqüencial.|
|actor\_id|UUID|FK profiles.id|Usuari que ha realitzat l'acció.|
|action|TEXT|NOT NULL|Acció realitzada (p.ex. EDIT\_ENTRY, CREATE\_USER).|
|target\_table|TEXT|NULLABLE|Taula afectada.|
|target\_id|TEXT|NULLABLE|Identificador del registre afectat.|
|old\_data|JSONB|NULLABLE|Valor anterior (per a edicions).|
|new\_data|JSONB|NULLABLE|Valor nou (per a edicions).|
|created\_at|TIMESTAMPTZ|DEFAULT now()|Marca de temps de l'acció.|


# **7. Interfície d'Usuari i Experiència (UX)**
## **7.1 Principis de disseny**
- Minimalisme funcional: cada pantalla té una acció principal clara.
- Feedback immediat: tota acció té una resposta visual en menys de 200 ms.
- Colors semàntics: verd (jornada activa), taronja (pausa), gris (finalitzada), vermell (incidència).
- Tipografia llegible: mínim 16px en cos de text, 14px en etiquetes.

## **7.2 Pantalles principals**

|**Pantalla**|**Contingut i funcionalitat**|
| :-: | :-: |
|Inici / Dashboard|Botó de fitxatge, estat actual de la jornada, resum del dia i de la setmana.|
|Historial personal|Llistat paginat de jornades amb filtre per dates. Detall expandible de cada dia.|
|Informes|Selecció de rang, visualització de gràfics i opcions d'exportació.|
|Perfil|Edició de dades personals, canvi de contrasenya i preferències de notificació.|
|Administració > Usuaris|Taula de tots els treballadors amb opcions de filtre, edició i alta.|
|Administració > Registres|Visió global de tots els fitxatges amb cerca avançada.|
|Administració > Informes|Generació d'informes agregats per departament o per treballador.|
|Administració > Configuració|Paràmetres del sistema, calendari laboral i festius.|


# **8. Seguretat i Compliment Legal**
## **8.1 Protecció de dades (RGPD / LOPDGDD)**
- L'escola cooperativa actua com a Responsable del Tractament de dades personals dels treballadors.
- Cal actualitzar el Registre d'Activitats de Tractament (RAT) per incloure HorariCoop.
- La base jurídica del tractament és l'execució del contracte laboral (art. 6.1.b RGPD).
- Els treballadors han de ser informats del tractament (clàusula informativa en el moment d'alta).
- Cal definir els terminis de conservació (mínim 4 anys, segons normativa laboral espanyola).
- S'ha de signar un contracte d'encàrrec de tractament (DPA) amb Supabase.

## **8.2 Control de jornada (Estatut dels Treballadors)**
- El sistema compleix els requisits de l'art. 34.9 ET i la normativa associada sobre registre diari de jornada.
- Els registres han de ser fidedignes i inalterables per part dels treballadors un cop enviats.
- L'historial de canvis és accessible per a la inspecció de treball si fos requerida.

## **8.3 Seguretat de l'aplicació**
- Revisió de seguretat (OWASP Top 10) abans del llançament a producció.
- Rate limiting en els endpoints d'autenticació per prevenir atacs de força bruta.
- Validació estricta de dades d'entrada al frontend i al backend.
- Política de CORS restrictiva: només el domini de l'aplicació.
- Headers de seguretat HTTP: CSP, HSTS, X-Frame-Options, etc.


# **9. Proves i Criteris d'Acceptació**
## **9.1 Estratègia de proves**

|**Nivell**|**Eina**|**Cobertura mínima**|
| :-: | :-: | :-: |
|Tests unitaris|Vitest / Jest|70% de la lògica de negoci|
|Tests d'integració|Supabase local + Vitest|Tots els fluxos de fitxatge|
|Tests E2E|Playwright|Happy paths principals|
|Tests de rendiment|k6 / Lighthouse CI|Requisits de la secció 4.1|
|Tests d'accessibilitat|axe-core / Lighthouse|0 errors crítics WCAG 2.1 AA|

## **9.2 Criteris d'acceptació principals**
- RF-05: El fitxatge d'entrada es registra en menys de 500ms i mostra confirmació visual.
- RF-07: Les pauses es descompten correctament del total d'hores netes.
- RF-08: La geolocalització es captura amb precisió < 100m quan el permís és actiu.
- RF-13: Els informes generen dades correctes per qualsevol rang de dates seleccionat.
- RF-15: L'administrador pot crear un usuari i aquest rep el correu d'invitació en < 2 minuts.
- RNF: L'aplicació supera els 85 punts a Google Lighthouse en Performance.


# **10. Planificació i Fases del Projecte**
## **10.1 Fases proposades**

|**Fase**|**Nom**|**Durada estimada**|**Entregables**|
| :-: | :-: | :-: | :-: |
|Fase 0|Descoberta i disseny|2 setmanes|Wireframes, diagrama BD, SRS validat.|
|Fase 1|MVP — Fitxatge bàsic|4 setmanes|Login, fitxatge entrada/sortida, panell personal.|
|Fase 2|Pauses i informes|3 setmanes|Gestió de pauses, vistes setmanal/mensual, exportació.|
|Fase 3|Administració|3 setmanes|Panell admin, gestió d'usuaris, calendari.|
|Fase 4|Geolocalització i alertes|2 setmanes|GPS, mapes, notificacions per correu.|
|Fase 5|Proves i llançament|2 setmanes|Tests complets, documentació, deploy producció.|

**Durada total estimada del projecte: 16 setmanes (~4 mesos).**


# **11. Riscos i Pla de Mitigació**

|**Risc**|**Probabilitat**|**Impacte**|**Mitigació**|
| :-: | :-: | :-: | :-: |
|Baixa adopció per part dels treballadors|Mitjana|Alt|Formació, UX intuïtiva, pilot amb un departament.|
|Problemes de precisió GPS en interiors|Alta|Baix|GPS és opcional; geofencing no obligatori.|
|Canvis normatius sobre registre horari|Baixa|Mitjà|Arquitectura modular per adaptar fàcilment.|
|Dependència del servei Supabase|Baixa|Alt|SLA 99.9%; mode offline parcial; backups diaris.|
|Bretxa de seguretat / accés no autoritzat|Baixa|Alt|RLS, JWT, HTTPS, auditoria, revisió OWASP.|
|Retards en el desenvolupament|Mitjana|Mitjà|MVP per fases; prioritzar funcionalitat核心.|


*— Fi del Document SRS v1.0 — HorariCoop · Escola Cooperativa · Març 2026 —*
Pàgina  de 
