#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

PROTO_REPO_URL="https://github.com/ErkanBarin/coingaming_protobuf.git" # Or your specific URL
PROTO_BRANCH="main" # Or a specific tag/commit

# Local directory where protos will be stored, relative to project root
LOCAL_PROTO_DIR="./protos"
# Temporary directory for cloning
TEMP_PROTO_CLONE_DIR=$(mktemp -d)

echo "Cloning protobufs from $PROTO_REPO_URL (branch: $PROTO_BRANCH) into $TEMP_PROTO_CLONE_DIR..."
git clone --depth 1 --branch "$PROTO_BRANCH" "$PROTO_REPO_URL" "$TEMP_PROTO_CLONE_DIR"

echo "Cleaning up existing local protos in $LOCAL_PROTO_DIR..."
rm -rf "$LOCAL_PROTO_DIR"
mkdir -p "$LOCAL_PROTO_DIR"

# IMPORTANT: Adjust this path if the root of your .proto files within the cloned repository is different.
# This assumes that within the cloned repo, the actual proto source tree (e.g., containing 'substance/', 'common/', etc.)
# is inside a directory named 'coingaming_protobuf'.
# For example, if your protos are like: coingaming_protobuf/coingaming_protobuf/substance/limits/service.proto
CLONED_PROTO_SRC_ROOT="$TEMP_PROTO_CLONE_DIR/coingaming_protobuf" # Path to the *inner* coingaming_protobuf dir

if [ ! -d "$CLONED_PROTO_SRC_ROOT" ]; then
  echo "ERROR: Expected proto source root directory not found: $CLONED_PROTO_SRC_ROOT"
  echo "Please check the structure of the protobuf repository and adjust CLONED_PROTO_SRC_ROOT in this script."
  rm -rf "$TEMP_PROTO_CLONE_DIR"
  exit 1
fi

echo "Copying all .proto files and their directory structure from $CLONED_PROTO_SRC_ROOT to $LOCAL_PROTO_DIR..."
# This attempts to copy the entire content, preserving subdirectories.
# Using 'cp -R' followed by copying contents using '*' ensures that if CLONED_PROTO_SRC_ROOT has contents like 'substance', 'common',
# these will be copied directly into LOCAL_PROTO_DIR.
cp -R "$CLONED_PROTO_SRC_ROOT"/* "$LOCAL_PROTO_DIR/"

echo "Protobuf sync complete. Local protos are in $LOCAL_PROTO_DIR"

echo "Cleaning up temporary clone directory $TEMP_PROTO_CLONE_DIR..."
rm -rf "$TEMP_PROTO_CLONE_DIR"

echo "Local protos directory ($LOCAL_PROTO_DIR) contents:"
ls -R "$LOCAL_PROTO_DIR"
