#!/bin/bash
set -e

echo "Installing frontend dependencies..."
cd frontend
npm install --include=dev --legacy-peer-deps
echo "Building frontend..."
npm run build
cd ..

echo "Installing backend dependencies..."
cd backend
npm install --include=dev --legacy-peer-deps
echo "Generating Prisma client..."
npx prisma generate
echo "Pushing database schema..."
npx prisma db push --accept-data-loss
echo "Build completed!"
