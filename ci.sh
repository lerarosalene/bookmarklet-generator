#!/usr/bin/env bash

set -ex

npm ci
npm run typecheck
npm run build

pushd dist
  zip -r ../dist.zip .
popd

curl \
  -H"Content-Type: application/zip" \
  -H"Authorization: Bearer ${NETLIFY_TOKEN}" \
  -XPOST \
  --data-binary "@dist.zip" \
  "https://api.netlify.com/api/v1/sites/${SITE_ID}/deploys"