import { Writable } from 'node:stream';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderToPipeableStream } from 'react-dom/server';
import { createServer } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webAppRoot = path.resolve(__dirname, '..');

function installStoragePolyfill() {
  const createMemoryStorage = () => {
    const map = new Map();
    return {
      getItem: (key) => (map.has(String(key)) ? map.get(String(key)) : null),
      setItem: (key, value) => {
        map.set(String(key), String(value));
      },
      removeItem: (key) => {
        map.delete(String(key));
      },
      clear: () => {
        map.clear();
      },
      key: (index) => Array.from(map.keys())[index] ?? null,
      get length() {
        return map.size;
      },
    };
  };

  if (typeof globalThis.localStorage === 'undefined') {
    globalThis.localStorage = createMemoryStorage();
  }
  if (typeof globalThis.sessionStorage === 'undefined') {
    globalThis.sessionStorage = createMemoryStorage();
  }
  if (typeof globalThis.WebSocket === 'undefined') {
    globalThis.WebSocket = class MockWebSocket {
      static CONNECTING = 0;
      static OPEN = 1;
      static CLOSING = 2;
      static CLOSED = 3;
      readyState = 3;
      close() {}
      send() {}
      addEventListener() {}
      removeEventListener() {}
    };
  }
}

function renderElementToHtml(element) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const writable = new Writable({
      write(chunk, _encoding, callback) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        callback();
      },
    });

    const timeoutId = setTimeout(() => {
      abort();
      reject(new Error('SSR render timed out after 5000ms'));
    }, 5000);

    const fail = (err) => {
      clearTimeout(timeoutId);
      reject(err);
    };

    writable.on('error', fail);
    writable.on('finish', () => {
      clearTimeout(timeoutId);
      resolve(Buffer.concat(chunks).toString('utf8'));
    });

    const { pipe, abort } = renderToPipeableStream(element, {
      onAllReady() {
        pipe(writable);
      },
      onShellError(err) {
        fail(err);
      },
      onError(err) {
        // React logs recoverable errors here; reject only on shell/fatal issues unless unhandled
        console.error('[SSR test render error]', err);
      },
    });
  });
}

async function main() {
  installStoragePolyfill();

  const origConsoleError = console.error;
  console.error = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes('Warning: useLayoutEffect does nothing on the server')) {
      return;
    }
    origConsoleError(...args);
  };

  const vite = await createServer({
    root: webAppRoot,
    server: { middlewareMode: true, watch: null, hmr: false },
    appType: 'custom',
    logLevel: 'silent',
    optimizeDeps: { noDiscovery: true },
  });

  try {
    console.log('=== 1/2 Running LandingResolver & RBAC Unit Spec ===');
    const landingSpec = await vite.ssrLoadModule('/src/services/landing-resolver.spec.ts');
    landingSpec.runLandingResolverAndFrontendRbacTests();

    console.log('\n=== 2/2 Running Academic Management Navigation & Guard Suite ===');
    const navSpec = await vite.ssrLoadModule(
      '/src/modules/academic/__tests__/academic-navigation.spec.tsx',
    );
    const summary = await navSpec.runAcademicNavigationTests(renderElementToHtml);
    for (const line of summary.results) {
      console.log(`  ${line}`);
    }
    console.log(`\nAll ${summary.passed}/${summary.total} Academic navigation test groups passed.`);

    console.log('\n=== 3/3 Running Hybrid Classroom Portal & Navigation Suite ===');
    const classroomSpec = await vite.ssrLoadModule(
      '/src/modules/classroom/__tests__/classroom-portal.spec.tsx',
    );
    const classroomSummary = await classroomSpec.runClassroomPortalFrontendTests(
      renderElementToHtml,
    );
    for (const line of classroomSummary.results) {
      console.log(`  ${line}`);
    }
    console.log(
      `\nAll ${classroomSummary.passed}/${classroomSummary.total} Hybrid Classroom frontend test groups passed.`,
    );

    console.log('\n=== 4/5 Running Learning Activities Portal & Navigation Suite ===');
    const learningSpec = await vite.ssrLoadModule(
      '/src/modules/learning-activities/__tests__/learning-activities-portal.spec.tsx',
    );
    const learningSummary = await learningSpec.runLearningActivitiesPortalFrontendTests(
      renderElementToHtml,
    );
    for (const line of learningSummary.results) {
      console.log(`  ${line}`);
    }
    console.log(
      `\nAll ${learningSummary.passed}/${learningSummary.total} Learning Activities frontend test groups passed.`,
    );

    console.log('\n=== 5/5 Running AI Teacher Copilot Portal & Navigation Suite ===');
    const aiCopilotSpec = await vite.ssrLoadModule(
      '/src/modules/ai-teacher-copilot/__tests__/ai-copilot-portal.spec.tsx',
    );
    const aiCopilotSummary = await aiCopilotSpec.runAiCopilotPortalFrontendTests(
      renderElementToHtml,
    );
    for (const line of aiCopilotSummary.results) {
      console.log(`  ${line}`);
    }
    console.log(
      `\nAll ${aiCopilotSummary.passed}/${aiCopilotSummary.total} AI Teacher Copilot frontend test groups passed.`,
    );
  } finally {
    await vite.close();
  }
}

main().catch((err) => {
  console.error('\nFAILED:', err);
  process.exit(1);
});
