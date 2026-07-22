// lib/db/client.ts
//
// Server-side Drizzle client. Import this in Server Components / route
// handlers only -- never bundle this into client-side code, since it
// uses DATABASE_URL which is not a NEXT_PUBLIC_ variable.

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Check your .env file.");
}

const queryClient = postgres(process.env.DATABASE_URL);

export const db = drizzle(queryClient, { schema });
