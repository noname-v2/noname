#!/bin/sh

# Generate index for components, stages and entities
rm -rf src/build
mkdir src/build
node scripts/index.mjs

# TypeScript compilation
rm -rf build
npx tsc

# Bundle to the working directories of each platform
for src in build/platforms/*; do
  # Skip if parameter is provided and doesn't match the current platform
  if [ ! -z "$1" ] && [ "$(basename "$src")" != "$1" ]; then
    continue
  fi
  mkdir -p dist/$(basename "$src")

  # Rollup main thread and worker thread
  rollup "$src"/index.js --file dist/$(basename "$src")/index.js --format iife
  rollup "$src"/server.js --file dist/$(basename "$src")/server.js --format iife

  # Copy platform-specific files e.g. Electron's main.js
  find "$src" -type f -not -name "index.js" -exec cp {} dist/$(basename "$src")/ \;

  # Link assets and copy static files
  ln -sf ../../assets dist/$(basename "$src")/assets
  ln -sf ../../src/index.html dist/$(basename "$src")/index.html
  ln -sf ../../src/app.webmanifest dist/$(basename "$src")/app.webmanifest
  ln -sf ../../dist/server.js dist/$(basename "$src")/server.js
done
