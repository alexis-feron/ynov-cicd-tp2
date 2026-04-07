/**
 * Point d'entree de production : demarre le serveur HTTP.
 *
 * Volontairement separe de src/app.ts pour que les tests puissent
 * importer l'app sans declencher de listen() (pas de port occupe).
 */
import { serve } from "@hono/node-server";
import { app } from "./app.js";

const port = Number(process.env.PORT) || 3000;
serve({ fetch: app.fetch, port });
console.log(`Server running on http://localhost:${port}`);
