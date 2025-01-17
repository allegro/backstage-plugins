#!/bin/bash
set -e

export NODE_OPTIONS="--max-old-space-size=4096"
export COREPACK_ENABLE_DOWNLOAD_PROMPT=0

yarn install --immutable
yarn tsc 
yarn build:backend --config ../../app-config.yaml --config ../../app-config.local.yaml