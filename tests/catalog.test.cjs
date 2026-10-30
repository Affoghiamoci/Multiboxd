const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { createServer } = require('node:net');
const path = require('node:path');
const { once } = require('node:events');

let base = process.env.TEST_URL;
let server;
let output = '';
before(async () => {
  if (!base) {
    const listener = createServer().listen(0, '127.0.0.1');
    await once(listener, 'listening');
    const port = listener.address().port;
    await new Promise(resolve => listener.close(resolve));
    base = `http://127.0.0.1:${port}`;
    server = spawn(process.execPath, [
      '--require', path.join(__dirname, 'upstreams.cjs'), '.next/standalone/server.js',
    ], { env: { ...process.env, PORT: String(port), HOSTNAME: '127.0.0.1', TMDB_API_KEY: 'test-only', DASHBOARD_URL: '' } });
    server.stdout.on('data', data => { output += data; });
    server.stderr.on('data', data => { output += data; });
    server.on('error', error => { output += error.message; });
  }
  for (let attempt = 0; attempt < 100; attempt++) {
    try {
      if ((await fetch(`${base}/health`)).ok) return;
    } catch { /* Attendi l'avvio del server. */ }
    if (server?.exitCode != null) break;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(`Server did not start: ${output}`);
});
after(async () => {
  if (server && server.exitCode === null) {
    server.kill();
    await once(server, 'exit');
  }
});

function config(settings = {}) {
  return Buffer.from(JSON.stringify({ lbUsername: 'fixture', catalogs: { watchlist: true }, ...settings })).toString('base64url');
}
async function catalog(settings = {}, extra = '.json', options) {
  return fetch(`${base}/${config(settings)}/catalog/movie/lb-watchlist${extra}`, options);
}
async function posterUrl(scenario, settings = {}) {
  const res = await catalog({ rpdbKey: `test-${scenario}`, rpdbStyle: 'poster-custom', ...settings });
  assert.equal(res.status, 200);
  return (await res.json()).metas[0].poster;
}
const tmdbPoster = 'https://image.tmdb.org/t/p/w500/fixture.jpg';

test('Watchlist: 100/100/35/0 film unici, senza saltare gli ID non risolti', async () => {
  const manifest = await (await fetch(`${base}/${config()}/manifest.json`)).json();
  assert.deepEqual(manifest.catalogs[0].extra, [{ name: 'skip', isRequired: false }]);
  const all = [];
  for (const [skip, count] of [[0, 100], [100, 100], [200, 35], [235, 0]]) {
    const res = await catalog({}, skip ? `/skip=${skip}.json` : '.json');
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('access-control-allow-origin'), '*');
    const { metas } = await res.json();
    assert.equal(metas.length, count);
    for (const meta of metas) {
      assert.equal(meta.type, 'movie');
      assert.equal(meta.poster, tmdbPoster);
      assert.equal(meta.name, `Film ${Number(meta.id.slice(2)) - 1000000}`);
    }
    all.push(...metas);
  }
  const expected = Array.from({ length: 237 }, (_, n) => n).filter(n => ![5, 110].includes(n)).map(n => `tt${1000000 + n}`);
  assert.deepEqual(all.map(meta => meta.id), expected);
  const query = await (await catalog({}, '.json?skip=30')).json();
  assert.deepEqual(query.metas.map(meta => meta.id), expected.slice(30, 130));
});

test('Watchlist corta, vuota e richieste simultanee', async () => {
  const pages = await Promise.all([catalog({ lbUsername: 'short' }), catalog({ lbUsername: 'short' })]);
  const [first, second] = await Promise.all(pages.map(res => res.json()));
  assert.equal(first.metas.length, 63);
  assert.deepEqual(first, second);
  assert.deepEqual((await (await catalog({ lbUsername: 'empty' })).json()).metas, []);
});

test('Una pagina bloccata si può ritentare; gli offset non validi sono rifiutati', async () => {
  const blocked = await catalog({ lbUsername: 'retry' });
  assert.equal(blocked.status, 502);
  assert.equal(blocked.headers.get('cache-control'), 'no-store');
  assert.equal((await (await catalog({ lbUsername: 'retry' })).json()).metas.length, 100);
  for (const skip of ['-1', '100oops', '9007199254740992']) {
    assert.equal((await catalog({}, `/skip=${skip}.json`)).status, 400);
  }
});

test('RPDB e OpenPosterDB mantengono stile e fallback', async () => {
  for (const rpdbProvider of ['rpdb', 'opdb']) {
    const url = await posterUrl('working', { rpdbProvider, lbSessionToken: 'private', stremioAuthKey: 'private' });
    const encoded = new URL(url).pathname.split('/')[2];
    assert.deepEqual(JSON.parse(Buffer.from(encoded, 'base64url')), {
      rpdbKey: 'test-working', rpdbStyle: 'poster-custom', rpdbProvider, language: 'it-IT',
    });
    const image = await fetch(url);
    assert.equal(image.status, 200);
    assert.equal(image.headers.get('content-type'), 'image/jpeg');
    assert.deepEqual(new Uint8Array(await image.arrayBuffer()), new Uint8Array([255, 216, 255]));
  }
});

test('Errori del provider, immagini vuote e timeout usano TMDB', async () => {
  for (const scenario of ['403', '404', '429', '500', 'empty', 'html', 'timeout']) {
    const response = await fetch(await posterUrl(scenario), { redirect: 'manual' });
    assert.equal(response.status, 302, scenario);
    assert.equal(response.headers.get('location'), tmdbPoster, scenario);
    assert.equal(response.headers.get('cache-control'), 'public, max-age=60');
  }
});

test('Gli URL delle locandine rispettano il reverse proxy e non accettano redirect arbitrari', async () => {
  const response = await catalog({ rpdbKey: 'test-working' }, '.json', {
    headers: { 'x-forwarded-host': 'addon.example', 'x-forwarded-proto': 'https' },
  });
  assert.equal(new URL((await response.json()).metas[0].poster).origin, 'https://addon.example');
  const url = new URL(await posterUrl('404'));
  url.searchParams.set('tmdb', 'https://untrusted.example/image.jpg');
  assert.equal((await fetch(url, { redirect: 'manual' })).headers.get('location'), tmdbPoster);
  url.pathname = url.pathname.replace(/tt\d+\.jpg$/, 'bad.jpg');
  assert.equal((await fetch(url)).status, 400);
});

test('Metahub resta il fallback se TMDB non ha una locandina', async () => {
  const url = await posterUrl('404', { language: 'no-poster' });
  const response = await fetch(url, { redirect: 'manual' });
  assert.equal(response.headers.get('location'), 'https://images.metahub.space/poster/medium/tt1000000/img');
});
