# Sitemap i wireframes HorariCoop v1

## 1. Objectiu d'aquest document

Aquest document baixa la planificacio funcional a una estructura navegable de producte i a wireframes textuals de les pantalles principals. La idea es fixar l'arquitectura UX abans de modelar la base de dades i el backlog tecnic.

## 2. Sitemap definitiu

```text
Public
  /login
  /activar-compte
  /recuperar-contrasenya
  /restablir-contrasenya

App protegida
  /app
  /app/historial
  /app/informes
  /app/perfil

Coordinacio
  /app/equip
  /app/equip/incidencies
  /app/equip/informes

Administracio
  /app/admin/usuaris
  /app/admin/registres
  /app/admin/informes
  /app/admin/calendari
  /app/admin/configuracio
  /app/admin/auditoria
```

## 3. Navegacio per rol

### Cooperativista
- navegacio principal: Inici, Historial, Informes, Perfil
- CTA dominant al dashboard: iniciar jornada, finalitzar jornada o gestionar pausa

### Coordinador/a
- mateix nucli que cooperativista
- accessos extra: Equip, Incidencies, Informes d'equip

### Administrador/a
- mateix nucli base
- bloc admin complet amb usuaris, registres, informes, calendari, configuracio i auditoria

## 4. Regles de navegacio

- el dashboard sempre es la pantalla d'aterratge post-login
- la CTA principal ha d'estar visible sense scroll en mobil i desktop
- la navegacio no ha de mostrar opcions sense permis
- qualsevol registre editable ha de tenir traca d'auditoria visible o accessible
- el perfil ha d'agrupar preferencies, llengua, seguretat i notificacions

## 5. Estructura de layout

### Desktop
- sidebar esquerra fixa
- header superior compacte amb nom, rol, canvi de llengua i avatar
- contingut centrat amb amplada maxima controlada

### Mobil
- header superior amb estat curt
- navegacio inferior de 4 icones: Inici, Historial, Informes, Perfil
- accions critiques en sticky bottom si cal

## 6. Wireframes principals

### 6.1 Login

Objectiu: entrada rapida, clara i sense soroll.

```text
+------------------------------------------------------+
| LOGO Escola / HorariCoop                             |
|                                                      |
| Control horari del personal                          |
| Acces segur i registre de jornada                    |
|                                                      |
| Email                                                |
| [______________________________]                     |
|                                                      |
| Contrasenya                                          |
| [______________________________]                     |
|                                                      |
| [ Entra ]                                            |
|                                                      |
| Has oblidat la contrasenya?                          |
|                                                      |
| Peu legal / privacitat / idiomes                     |
+------------------------------------------------------+
```

Claus UX:
- formulari curt
- missatge de confiança i context institucional
- error d'autenticacio visible sota el camp afectat

### 6.2 Dashboard - jornada no iniciada

Objectiu: fitxar en menys de 2 tocs.

```text
+---------------------------------------------------------------+
| Hola, Marta                           Dc 20 Mar   08:12       |
|---------------------------------------------------------------|
| ESTAT DE JORNADA                                             |
| No has iniciat la jornada                                     |
|                                                               |
| [ Iniciar jornada ]                                           |
|                                                               |
| Jornada contractual avui: 7h 30m                              |
|                                                               |
| Resum d'avui                                                  |
| - Entrada: --                                                 |
| - Pauses: --                                                  |
| - Sortida: --                                                 |
|                                                               |
| Aquesta setmana                                               |
| [ Dl  ] [ Dm 7h20 ] [ Dc avui ] [ Dj ] [ Dv ]                 |
|                                                               |
| Alertes / avisos                                              |
+---------------------------------------------------------------+
```

Components:
- targeta hero amb estat
- CTA principal molt visible
- resum curt del dia
- mini resum setmanal

### 6.3 Dashboard - jornada activa

Objectiu: veure estat, temps acumulat i accions possibles.

```text
+---------------------------------------------------------------+
| JORNADA ACTIVA                               3h 42m            |
| Inici: 08:03                                                   |
|                                                               |
| [ Iniciar pausa ]     [ Finalitzar jornada ]                  |
|                                                               |
| Cronologia del dia                                            |
| 08:03  Entrada registrada                                     |
|                                                               |
| Resum provisional                                             |
| - Temps brut: 3h 42m                                          |
| - Pauses: 0m                                                  |
| - Temps net: 3h 42m                                           |
|                                                               |
| Localitzacio: registrada / no registrada                      |
+---------------------------------------------------------------+
```

Notes:
- `Finalitzar jornada` es accio secundaria visualment pero molt clara
- el temporitzador ha de ser estable i facil de llegir

### 6.4 Modal / pantalla de pausa

Objectiu: iniciar una pausa amb una unica decisio.

```text
+------------------------------------------+
| Iniciar pausa                            |
|------------------------------------------|
| Selecciona el tipus                      |
|                                          |
| ( ) Esmorzar                             |
| ( ) Dinar                                |
| ( ) Pausa personal                       |
| ( ) Reunio externa                       |
|                                          |
| [ Cancel.lar ]     [ Iniciar pausa ]     |
+------------------------------------------+
```

Quan la pausa esta activa:

```text
+---------------------------------------------------+
| PAUSA ACTIVA                         00:18         |
| Tipus: Dinar                                        |
|                                                     |
| [ Finalitzar pausa ]                                |
|                                                     |
| En pausa des de les 11:47                           |
+---------------------------------------------------+
```

### 6.5 Dashboard - jornada finalitzada

Objectiu: tancar el dia amb sensacio de registre complet.

```text
+---------------------------------------------------------------+
| JORNADA FINALITZADA                                           |
| Entrada 08:03   Sortida 15:41                                 |
|                                                               |
| Hores brutes: 7h 38m                                          |
| Pauses: 0h 30m                                                |
| Hores netes: 7h 08m                                           |
|                                                               |
| [ Veure detall ]      [ Afegir nota ]                         |
|                                                               |
| Estat setmanal                                                |
| Total acumulat: 28h 10m / 37h 30m                             |
+---------------------------------------------------------------+
```

### 6.6 Historial personal

Objectiu: revisar jornades, filtrar i detectar incidencies.

```text
+-----------------------------------------------------------------------+
| Historial                                                             |
| [ Data inici ] [ Data fi ] [ Estat ] [ Cercar ]                       |
|-----------------------------------------------------------------------|
| 20 Mar  Entrada 08:03  Sortida 15:41  Netes 7h08   OK   [ Detall ]    |
| 19 Mar  Entrada 08:00  Sortida 14:58  Netes 6h28   !    [ Detall ]    |
| 18 Mar  Entrada 08:11  Sortida 16:02  Netes 7h21   OK   [ Detall ]    |
|-----------------------------------------------------------------------|
| Paginacio                                                             |
+-----------------------------------------------------------------------+
```

En el detall expandit:
- cronologia del dia
- pauses
- coordenades si n'hi ha
- notes
- historial de correccions si existeix

### 6.7 Informes personals

Objectiu: entendre el temps treballat d'un cop d'ull i exportar-lo.

```text
+-------------------------------------------------------------------+
| Informes                                                          |
| [ Setmana ] [ Mes ] [ Trimestre ] [ Rang personalitzat ]          |
| [ Exportar CSV ] [ Exportar PDF ]                                 |
|-------------------------------------------------------------------|
| Hores treballades per dia                                         |
| [ grafic barres ]                                                 |
|                                                                   |
| Distribucio de pauses                                              |
| [ grafic circular ]                                               |
|                                                                   |
| Resum numerics                                                    |
| - Total hores                                                     |
| - Dies treballats                                                 |
| - Hores extres                                                    |
+-------------------------------------------------------------------+
```

### 6.8 Perfil

Objectiu: centralitzar la configuracio personal.

```text
+--------------------------------------------------------------+
| Perfil                                                       |
|--------------------------------------------------------------|
| Dades personals                                              |
| - Nom                                                        |
| - Email                                                      |
| - Departament                                                |
|                                                              |
| Preferencies                                                 |
| [ ] Catala                                                   |
| [ ] Castella                                                 |
| [ ] Mode fosc                                                |
|                                                              |
| Notificacions                                                |
| [ ] Avis de sortida pendent                                  |
| [ ] Resum setmanal                                           |
|                                                              |
| Seguretat                                                    |
| [ Canviar contrasenya ]                                      |
+--------------------------------------------------------------+
```

### 6.9 Coordinacio - equip

Objectiu: detectar incidencies i supervisar sense sobrecarregar la UI.

```text
+------------------------------------------------------------------------+
| Equip                                                                  |
| [ Curs / departament ] [ Estat ] [ Cercar persona ]                    |
|------------------------------------------------------------------------|
| Marta P.      Jornada activa      08:03 -> --         [ Veure ]         |
| Joan R.       Falta sortida       07:58 -> --         [ Revisar ]       |
| Clara S.      Jornada tancada     08:11 -> 15:32      [ Veure ]         |
|------------------------------------------------------------------------|
| Incidencies obertes                                                    |
+------------------------------------------------------------------------+
```

### 6.10 Admin - usuaris

Objectiu: alta i manteniment d'usuaris sense entrar al detall tecnic.

```text
+----------------------------------------------------------------------------+
| Usuaris                                                     [ Nou usuari ] |
|----------------------------------------------------------------------------|
| [ Rol ] [ Estat ] [ Equip ] [ Cercar ]                                     |
|----------------------------------------------------------------------------|
| Marta P.   worker       actiu     Primaria        [ Editar ] [ Desactivar ]|
| Joan R.    coordinator  actiu     Administracio   [ Editar ] [ Desactivar ]|
| Anna V.    admin        actiu     Direccio        [ Editar ] [ Desactivar ]|
+----------------------------------------------------------------------------+
```

Ficha o drawer d'usuari:
- dades basiques
- rol
- hores setmanals contractuals
- calendari assignat
- preferencies inicials
- reenviar invitacio

### 6.11 Admin - registres i correccions

Objectiu: intervenir nomes quan cal i deixar rastre complet.

```text
+--------------------------------------------------------------------------------+
| Registres                                                                      |
| [ Data ] [ Usuari ] [ Estat ] [ Departament ] [ Cercar ]                       |
|--------------------------------------------------------------------------------|
| 20 Mar  Marta P.   08:03 - 15:41   OK           [ Veure ] [ Corregir ]         |
| 20 Mar  Joan R.    07:58 - --      Incidencia   [ Veure ] [ Corregir ]         |
+--------------------------------------------------------------------------------+
```

Modal de correccio:

```text
+--------------------------------------------------------------+
| Corregir registre                                            |
|--------------------------------------------------------------|
| Entrada [ 08:00 ]                                            |
| Sortida [ 15:30 ]                                            |
| Nota interna [______________________________]                 |
| Justificacio obligatoria                                      |
| [__________________________________________________________] |
|                                                              |
| [ Cancel.lar ]                       [ Desar correccio ]     |
+--------------------------------------------------------------+
```

### 6.12 Admin - configuracio

Objectiu: editar parametres clau del sistema.

```text
+-------------------------------------------------------------------+
| Configuracio                                                      |
|-------------------------------------------------------------------|
| Jornada ordinaria maxima: [ 9 ] hores                             |
| Hores extra maximes:      [ 2 ] hores                             |
| Pausa minima recomanada:  [30] min                                |
|                                                                   |
| [ ] Activar geofencing                                            |
| Radi permis: [ 150 ] metres                                       |
|                                                                   |
| [ ] Activar Google OAuth                                          |
| [ ] Activar resum setmanal automatic                              |
|                                                                   |
| [ Desar canvis ]                                                  |
+-------------------------------------------------------------------+
```

## 7. Components transversals

### Estat de jornada
- no iniciada
- activa
- pausa activa
- finalitzada
- incidencia

### Components de sistema
- toast de confirmacio
- banner d'alerta
- modal de confirmacio
- empty state
- skeleton de carrega
- drawer de detall

### Components de dades
- taula responsive
- timeline de jornada
- targeta resum
- grafic de barres
- grafic circular
- mini calendari mensual

## 8. Criteris UX obligatoris

- qualsevol fitxatge s'ha de poder executar amb un maxim de 2 interaccions
- els colors mai poden ser l'unic indicador d'estat
- la informacio de temps ha de ser llegible a simple vista
- les incidencies han de quedar visibles pero no bloquejar la jornada normal
- els modals critics han de demanar confirmacio abans de tancar una jornada o desar una correccio

## 9. Decisions per a la seguent fase tecnica

Aquest sitemap i aquests wireframes ja permeten passar a:

1. model SQL inicial de Supabase
2. definicio de RLS per rol
3. backlog detallat del MVP

Recomanacio: el seguent document hauria de ser `SUPABASE_SCHEMA_HorariCoop_v1.sql` amb totes les taules base, enums i relacions.
