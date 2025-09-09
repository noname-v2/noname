#!/bin/sh
node scripts/index.mjs
npx tsc
for src in build/platforms/*; do
  mkdir -p dist/$(basename "$src")
  rollup "$src"/index.js --file dist/$(basename "$src")/index.js --format iife
  find "$src" -type f -not -name "index.js" -exec cp {} dist/$(basename "$src")/ \;
  cp src/index.html dist/$(basename "$src")
done