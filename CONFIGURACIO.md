# Configuració de HorariCoop

## 1. Configuració de Supabase

### Pas 1: Crear un compte i projecte
1. Vés a [supabase.com](https://supabase.com) i crea un compte
2. Crea un nou projecte
3. Espera que es desplegui (pot trigar uns minuts)

### Pas 2: Obtenir les claus d'API
1. Al teu projecte, vés a **Settings** → **API**
2. Copia:
   - **Project URL** (ex: `https://abc123.supabase.co`)
   - **anon / public** key (comença amb `eyJ...`)
   - **service_role** key (comença amb `eyJ...`) - OPCIONAL

### Pas 3: Configurar el fitxer .env
1. Copia el fitxer `.env.example` a `.env`:
   ```bash
   cp .env.example .env
   ```
2. Edita el fitxer `.env` i reemplaça els valors:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://EL_TEU_PROJECT_ID.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=LA_TEVA_ANON_KEY
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   SUPABASE_SERVICE_ROLE_KEY=LA_TEVA_SERVICE_ROLE_KEY
   ```

## 2. Configuració de la base de dades

### Pas 1: Executar el schema
1. Al teu projecte Supabase, vés a **SQL Editor**
2. Obre el fitxer `supabase/migrations/20260320120000_initial_schema.sql`
3. Copia i executa tot el contingut al SQL Editor
4. Executa també `supabase/migrations/20260320121000_rls_policies.sql`

### Pas 2: Carregar dades de prova (opcional)
1. Executa `supabase/seeds/history_demo_seed.sql` per carregar dades de prova

## 3. Instal·lació i execució

### Instal·lar dependències
```bash
npm install
```

### Executar en mode desenvolupament
```bash
npm run dev
```

L'aplicació estarà disponible a `http://localhost:3000`

## 4. Estructura del projecte

```
src/
├── app/              # Pàgines Next.js App Router
│   ├── (public)/     # Pàgines públiques (login, etc.)
│   ├── (protected)/  # Pàgines protegides (app, admin, etc.)
│   └── api/          # Rutes API
├── components/       # Components reutilitzables
├── features/         # Funcionalitats específiques
│   ├── auth/         # Autenticació
│   ├── dashboard/    # Dashboard principal
│   ├── history/      # Historial de jornades
│   ├── reports/      # Informes i exportació
│   ├── admin/        # Administració d'usuaris
│   └── team/         # Supervisió d'equip
├── lib/              # Utilitats i configuració
├── server/           # Lògica del servidor
│   ├── services/     # Serveis de negoci
│   └── repositories/ # Accés a dades
└── types/            # Definicions de tipus
```

## 5. Rols d'usuari

### Treballador
- Registra entrada i sortida
- Veu el seu historial
- Exporta els seus informes

### Coordinador
- Té accés a la pàgina d'equip
- Pot veure les dades del seu equip

### Administrador
- Accés complet a totes les funcionalitats
- Gestió d'usuaris
- Configuració del sistema

## 6. Funcionalitats principals

### Dashboard
- Fitxatge d'entrada/sortida
- Gestió de pauses
- Resum del dia i setmana
- Geolocalització (opcional)

### Informes
- Visualització diària, setmanal, mensual
- Gràfics interactius
- Exportació a CSV i PDF

### Administració
- CRUD d'usuaris
- Gestió de rols
- Configuració del sistema

## 7. Notes de seguretat

- Mai compartexis les claus d'API
- El fitxer .env està al .gitignore
- Les contrasenyes s'han d'encriptar
