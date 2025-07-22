#!/bin/bash

# Build script for creating release packages
echo "Building Traffic Light Timer releases..."

# Clean previous builds
rm -rf dist/

# Build for all platforms
echo "Building for Windows..."
npm run build -- --win

echo "Building for macOS..."
npm run build -- --mac

echo "Building for Linux..."
npm run build -- --linux

echo "Build complete! Check the dist/ directory for release files."