import { Kysely } from "kysely";
import { PostgresJSDialect } from "kysely-postgres-js";
import postgres from "postgres";
import type { DB } from "~/types/kysely";

export default function () {
  // const dialect = new PostgresDialect({
  //   pool: new Pool({
  //     database: process.env.DATABASE_NAME,
  //     host: process.env.DATABASE_HOST,
  //     max: 10,
  //     password: process.env.DATABASE_PASSWORD,
  //     port: parseInt(process.env.DATABASE_PORT || "5432"),
  //     user: process.env.DATABASE_USER,
  //   }),
  // });

  const dialect = new PostgresJSDialect({
    postgres: postgres({
      database: process.env.DATABASE_NAME,
      host: process.env.DATABASE_HOST,
      password: process.env.DATABASE_PASSWORD,
      port: parseInt(process.env.DATABASE_PORT || "5432"),
      user: process.env.DATABASE_USER,
    }),
  });

  return new Kysely<DB>({ dialect });
}
