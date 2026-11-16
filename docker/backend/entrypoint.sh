#!/bin/sh
# Apply the Prisma schema, then start the API as the container's main process.
set -eu

cd /app

if [ -z "${DATABASE_URL:-}" ] || [ -z "${DIRECT_URL:-}" ]; then
  echo "DATABASE_URL and DIRECT_URL are required." >&2
  exit 1
fi

echo "Waiting for Postgres..."
attempt=0
until node -e "
const net = require('net');
const raw = process.env.DATABASE_URL || '';
const normalized = raw.replace(/^postgres(ql)?:\/\//, 'http://');
let host = 'postgres';
let port = 5432;
try {
  const url = new URL(normalized);
  host = url.hostname || host;
  port = Number(url.port || port);
} catch (err) {
  process.exit(1);
}
const socket = net.connect({ host, port }, () => {
  socket.end();
  process.exit(0);
});
socket.setTimeout(2000, () => {
  socket.destroy();
  process.exit(1);
});
socket.on('error', () => process.exit(1));
"; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge 60 ]; then
    echo "Postgres did not accept connections in time." >&2
    exit 1
  fi
  sleep 2
done

if [ "${RUN_DB_PUSH:-true}" = "true" ]; then
  echo "Syncing Prisma schema with prisma db push..."
  ./node_modules/.bin/prisma db push \
    --schema=./prisma/schema.prisma \
    --skip-generate \
    --accept-data-loss
fi

echo "Starting API..."
exec node dist/server.js
