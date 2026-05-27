#!/bin/bash
set -e

echo "=== Build client (React) ==="
cd client
npm install
npm run build
cd ..

echo "=== Build server (Express) ==="
cd server
npm install
npm run build
cd ..

echo "=== Build terminé ==="
