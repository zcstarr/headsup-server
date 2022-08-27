#!/bin/bash
npm run build:publish-client
echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" > generated-client/client/typescript/.npmrc
cd generated-client/client/typescript && npm install && npx tsc && npm publish --access=public