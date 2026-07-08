// @ts-check

/** @param {import('@playwright/test').FullConfig} config */
export default async function globalSetup(config) {
  const baseURL = config.projects[0]?.use?.baseURL ?? 'http://localhost:5173';

  try {
    const response = await fetch(baseURL);
    if (!response.ok) {
      throw new Error(`received HTTP ${response.status}`);
    }
  } catch (error) {
    throw new Error(
      `Cannot reach ${baseURL} (${error instanceof Error ? error.message : error}).\n` +
        'Start the app stack first, e.g. from the repo root: docker compose up -d --wait'
    );
  }
}
