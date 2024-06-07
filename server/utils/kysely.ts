import { Kysely } from "kysely";
import { PostgresJSDialect } from "kysely-postgres-js";
import postgres from "postgres";
import type { DB } from "~/types/kysely";

export default function () {
  const { database, host, password, user } = useRuntimeConfig();

  // const dialect = new PostgresDialect({
  //   pool: new Pool({
  //     database: process.env.DATABASE,
  //     host: process.env.HOST,
  //     max: 10,
  //     password: process.env.PASSWORD,
  //     port: parseInt(process.env.PORT || "5432"),
  //     user: process.env.USER,
  //   }),
  // });

  const dialect = new PostgresJSDialect({
    postgres: postgres({
      database: process.env.DATABASE,
      host: process.env.HOST,
      password: process.env.PASSWORD,
      port: parseInt(process.env.PORT || "5432"),
      user: process.env.USER,
    }),
  });

  return new Kysely<DB>({ dialect });
}
