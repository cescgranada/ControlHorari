# History demo seed

- `history_demo_seed.sql` carrega 10 dies laborables de mostra per a tots els perfils actius.
- `history_demo_cleanup.sql` elimina aquestes dades de prova.
- Les files queden marcades amb `notes like 'seed:history-demo:%'` i `source = 'import'`.
- El seed desactiva temporalment els triggers d'usuari de `time_entries` i `breaks` per evitar els guardes de negoci durant la carga de dades de prova.

Ordre recomanat:

1. aplicar les migracions de `supabase/migrations/`
2. assegurar que existeix almenys un registre a `public.profiles`
3. executar `supabase/seeds/history_demo_seed.sql`
4. iniciar sessio amb algun dels perfils actius i validar `/app` i `/app/historial`
