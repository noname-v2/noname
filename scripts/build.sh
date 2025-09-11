#!/bin/sh

# Generate index for components, stages and entities
rm -rf src/build
mkdir src/build
node scripts/index.mjs

# TypeScript compilation
rm -rf build
npx tsc

# Bundle main interface and game interface
rollup build/server/home.js --file dist/home.js --format iife
rollup build/server/game.js --file dist/game.js --format iife

# Bundle to the working directories of each platform
for src in build/platforms/*; do
  # Skip if parameter is provided and doesn't match the current platform
  if [ ! -z "$1" ] && [ "$(basename "$src")" != "$1" ]; then
    continue
  fi
  mkdir -p dist/$(basename "$src")
  rollup "$src"/index.js --file dist/$(basename "$src")/index.js --format iife
  find "$src" -type f -not -name "index.js" -exec cp {} dist/$(basename "$src")/ \;
  rm -rf dist/$(basename "$src")/assets
  ln -s ../../assets dist/$(basename "$src")/assets
  cp src/index.html dist/$(basename "$src")
  cp src/app.webmanifest dist/$(basename "$src")
  cp dist/home.js dist/$(basename "$src")
  cp dist/game.js dist/$(basename "$src")
done

# Remove unnecessary files
rm dist/game.js
rm dist/home.js
