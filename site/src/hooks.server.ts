import type { Handle } from '@sveltejs/kit/hooks';

export const handle: Handle = ({ event, resolve }) =>
  resolve(event, {
    transformPageChunk: ({ html }) =>
      event.url.pathname.startsWith('/en') ? html.replace('<html lang="de">', '<html lang="en">') : html,
  });
