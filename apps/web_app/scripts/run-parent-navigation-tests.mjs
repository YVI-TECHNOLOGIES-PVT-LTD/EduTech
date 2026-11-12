import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Writable } from 'node:stream';
import { renderToPipeableStream } from 'react-dom/server';
import { createServer } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webAppRoot = path.resolve(__dirname, '..');

function installMinimalDomMocks() {
  if (typeof globalThis.localStorage === 'undefined') {
    const store = new Map();
    globalThis.localStorage = {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
      clear: () => store.clear(),
      key: (i) => Array.from(store.keys())[i] || null,
      get length() {
        return store.size;
      },
    };
  }
  if (typeof globalThis.sessionStorage === 'undefined') {
    const sstore = new Map();
    globalThis.sessionStorage = {
      getItem: (k) => (sstore.has(k) ? sstore.get(k) : null),
      setItem: (k, v) => sstore.set(k, String(v)),
      removeItem: (k) => sstore.delete(k),
      clear: () => sstore.clear(),
      key: (i) => Array.from(sstore.keys())[i] || null,
      get length() {
        return sstore.size;
      },
    };
  }
  if (typeof globalThis.matchMedia === 'undefined') {
    globalThis.matchMedia = () => ({
      matches: false,
      media: '',
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    });
  }
  if (typeof globalThis.WebSocket === 'undefined') {
    globalThis.WebSocket = class DummyWebSocket {
      addEventListener() {}
      removeEventListener() {}
      close() {}
      send() {}
    };
  }
  if (typeof globalThis.window === 'undefined') {
    globalThis.window = globalThis;
  }
}

async function renderToHtml(renderToPipeableStream, element) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const writable = new Writable({
      write(chunk, _encoding, callback) {
        chunks.push(Buffer.from(chunk));
        callback();
      },
    });
    const { pipe } = renderToPipeableStream(element, {
      onAllReady() {
        pipe(writable);
      },
      onError(err) {
        reject(err);
      },
    });
    writable.on('finish', () => {
      resolve(Buffer.concat(chunks).toString('utf8'));
    });
    writable.on('error', reject);
  });
}

async function main() {
  installMinimalDomMocks();
  const vite = await createServer({
    root: webAppRoot,
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
    logLevel: 'silent',
    ssr: {
      noExternal: ['react-router-dom', '@reduxjs/toolkit', 'react-redux'],
    },
  });

  try {
    const specMod = await vite.ssrLoadModule(
      '/src/modules/parent/__tests__/parent-navigation.spec.tsx',
    );

    const summary = await specMod.runParentNavigationTests((el) =>
      renderToHtml(renderToPipeableStream, el),
    );

    console.log('\n=== Parent Portal Navigation & RBAC SSR Test Summary ===');
    for (const line of summary.results) {
      console.log(`  ${line}`);
    }
    console.log(`Passed ${summary.passed}/${summary.total} checks.\n`);
  } finally {
    await vite.close();
  }
  process.exit(0);
}

main().catch((err) => {
  console.error('Parent navigation SSR test failed:', err);
  process.exit(1);
});
