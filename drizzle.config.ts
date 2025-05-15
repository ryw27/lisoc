import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

// export default defineConfig({
//   out: './drizzle/migrations',
//   schema: './app/lib/schema.ts',
//   dialect: 'postgresql',
//   dbCredentials: {
//     url: process.env.DATABASE_URL!,
//   },
// });


export default defineConfig({
  dialect: 'postgresql',
  schema: './drizzle/schema.ts',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
