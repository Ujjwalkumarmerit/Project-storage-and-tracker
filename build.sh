#!/bin/bash
set -e

echo "Installing backend dependencies..."
cd backend
npm install
echo "Generating Prisma client..."
npx prisma generate
echo "Pushing database schema..."
npx prisma db push
echo "Build completed!"
