#!/bin/bash
set -e

export NODE_OPTIONS="--max-old-space-size=4096"
export COREPACK_ENABLE_DOWNLOAD_PROMPT=0

parent_path=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )

/bin/bash "$parent_path/lint.sh"
yarn test:all