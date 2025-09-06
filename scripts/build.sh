#!/bin/sh
node scripts/index.mjs
npx tsc
rollup build/worker/worker.js --file dist/worker.js --format iife
rollup build/server/server.js --file dist/server.js --format iife
for src in build/platform/*; do
  mkdir -p dist/$(basename "$src")
  rollup "$src"/index.js --file dist/$(basename "$src")/index.js --format iife
  find "$src" -type f -not -name "index.js" -exec cp {} dist/$(basename "$src")/ \;
  cp src/index.html dist/$(basename "$src")
  cp dist/worker.js dist/$(basename "$src")
done
rm dist/worker.js