#!/bin/bash
set -e

# Get version from package.json
VERSION=$(node -p "require('./package.json').version")
echo "Building ST-Lang version $VERSION"

# Build the docker image and output to current directory
docker build -f Dockerfile.package -t st-package-builder .
docker rm st-extractor 2>/dev/null || true
docker create --name st-extractor st-package-builder /bin/true
docker cp st-extractor:/st-lang_${VERSION}_amd64.deb .
docker cp st-extractor:/st-lang-${VERSION}-1.x86_64.rpm .
docker cp st-extractor:/st .
docker rm st-extractor

echo "Done! Generated files:"
ls -lh st-lang_${VERSION}_amd64.deb st-lang-${VERSION}-1.x86_64.rpm st
