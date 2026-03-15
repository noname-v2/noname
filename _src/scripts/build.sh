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

  # Copy initialization code for client and server
  cp build/client/index.js "$src"/_client.js
  cp build/server/index.js "$src"/_server.js

  # Copy platform-specific files e.g. Electron's main.js
  find "$src" -type f -not -name "_*.js" -exec cp {} dist/$(basename "$src")/ \;

  # Rollup client and server entrypoints
  rollup "$src"/_client.js --file dist/$(basename "$src")/client.js --format iife
  rollup "$src"/_server.js --file dist/$(basename "$src")/server.js --format iife

  # Link assets and copy static files
  ln -sf ../../assets dist/$(basename "$src")/assets
  ln -sf ../../src/index.html dist/$(basename "$src")/index.html
  ln -sf ../../src/app.webmanifest dist/$(basename "$src")/app.webmanifest
done
