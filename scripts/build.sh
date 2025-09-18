#!/bin/sh

# Clean previous builds
rm -rf src/build
rm -rf build
rm -rf dist

# Generate index for components, stages and entities
mkdir src/build
node scripts/index.mjs

# TypeScript compilation
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
  find "$src" -type f -not -name "index.js" -not -name "server.js" -exec cp {} dist/$(basename "$src")/ \;

  # Link assets and copy static files
  ln -sf ../../assets dist/$(basename "$src")/assets
  ln -sf ../../src/index.html dist/$(basename "$src")/index.html
  ln -sf ../../src/app.webmanifest dist/$(basename "$src")/app.webmanifest
done
