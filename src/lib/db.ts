import { neon } from '@neondatabase/serverless';

const DATABASE_URL = import.meta.env.VITE_DATABASE_URL as string;

if (!DATABASE_URL) {
  console.warn('VITE_DATABASE_URL is not set. Database features will be unavailable.');
}

const sql = DATABASE_URL ? neon(DATABASE_URL, { fullResults: false }) : null;

export { sql };

export async function dbQuery<T = Record<string, unknown>>(
  query: string,
  params: unknown[] = []
): Promise<T[]> {
  if (!sql) {
    throw new Error('Database not configured');
  }
  try {
    // neon() with fullResults: false returns rows directly as an array
    const rows = await sql(query as unknown as TemplateStringsArray, ...params);
    return rows as T[];
  } catch (error) {
    console.error('DB Query Error:', error);
    throw error;
  }
}

export function isDbAvailable(): boolean {
  return sql !== null;
}
