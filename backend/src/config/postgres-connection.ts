export function normalizePostgresConnectionString(connectionString: string): string {
  const url = new URL(connectionString);

  if (!url.searchParams.has('sslmode')) {
    url.searchParams.set('sslmode', 'require');
  }

  if (url.searchParams.get('sslmode') === 'require' && !url.searchParams.has('uselibpqcompat')) {
    url.searchParams.set('uselibpqcompat', 'true');
  }

  return url.toString();
}
