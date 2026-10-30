// Fixture HTTP caricate solo nei test tramite --require.
const https = require('node:https');
const { EventEmitter } = require('node:events');
const { syncBuiltinESMExports } = require('node:module');

let blocked = true;
https.request = (options, callback) => {
  if (options.hostname !== 'letterboxd.com') throw new Error('Unexpected HTTPS host');
  const req = new EventEmitter();
  req.setTimeout = () => {};
  req.end = () => {
    const path = options.path;
    let body = '';
    let statusCode = 200;
    if (path.startsWith('/film/fixture-')) {
      const n = Number(path.match(/fixture-(\d+)/)[1]);
      if (![5, 110].includes(n)) body = `<a href="https://imdb.com/title/tt${1000000 + n}/">IMDb</a>`;
    } else {
      const username = path.match(/^\/(fixture|short|empty|retry)\/watchlist\//)?.[1];
      if (!username) throw new Error(`Unexpected Letterboxd path: ${path}`);
      let page = Number(path.match(/page\/(\d+)/)?.[1] || 1);
      if (username === 'retry' && page === 2 && blocked) {
        blocked = false;
        statusCode = 403;
      } else {
        const total = username === 'short' ? 64 : username === 'empty' ? 0 : 237;
        if (username === 'short') page = Math.min(page, 3); // Ultima pagina ripetuta.
        const start = (page - 1) * 28;
        const count = Math.max(0, Math.min(28, total - start));
        body = '<ul class="poster-list">' + Array.from({ length: count }, (_, i) => {
          const n = start + i;
          const poster = n % 2 === 0
            ? `<div class="react-component" data-component-class="LazyPoster" data-item-slug="fixture-${n}" data-item-name="Film ${n}"></div>`
            : `<div class="film-poster" data-film-slug="fixture-${n}"><img alt="Film ${n}" src="/empty.png"></div>`;
          return `<li class="poster-container">${poster}</li>`;
        }).join('') + '</ul>';
      }
    }
    const res = Object.assign(new EventEmitter(), { statusCode, headers: {} });
    callback(res);
    queueMicrotask(() => { res.emit('data', body); res.emit('end'); });
  };
  return req;
};
syncBuiltinESMExports();

const realFetch = global.fetch;
global.fetch = async (input, init) => {
  const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url);
  if (['localhost', '127.0.0.1'].includes(url.hostname)) return realFetch(input, init);
  if (url.hostname === 'api.themoviedb.org') {
    const poster_path = url.searchParams.get('language') === 'no-poster' ? null : '/fixture.jpg';
    return Response.json({ movie_results: [{ id: 1, poster_path }] });
  }
  if (['api.ratingposterdb.com', 'openposterdb.com'].includes(url.hostname)) {
    const match = url.pathname.match(/^\/test-([a-z0-9]+)\/imdb\/poster-custom\/tt\d+\.jpg$/);
    if (!match || url.searchParams.get('fallback') !== 'true') throw new Error(`Unexpected poster URL: ${url}`);
    const scenario = match[1];
    if (scenario === 'working') return new Response(new Uint8Array([255, 216, 255]), { headers: { 'content-type': 'image/jpeg' } });
    if (scenario === 'empty') return new Response('', { headers: { 'content-type': 'image/jpeg' } });
    if (scenario === 'html') return new Response('<html>Error</html>', { headers: { 'content-type': 'text/html' } });
    if (scenario === 'timeout') return new Promise((_, reject) => {
      init.signal.addEventListener('abort', () => reject(init.signal.reason), { once: true });
    });
    return new Response('Provider error', { status: Number(scenario) });
  }
  throw new Error(`Unexpected fetch host: ${url.hostname}`);
};
