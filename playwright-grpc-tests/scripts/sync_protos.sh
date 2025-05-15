#!/bin/bash

# Define paths
CGP_SOURCE_DIR="/Users/erkan.barin/Desktop/ApiCollection/coingaming_protobuf/coingaming_protobuf"
LAB_PROTO_SOURCE_DIR="/Users/erkan.barin/Desktop/ApiCollection/lab_protobuf_elixir/protobufs" # Renamed for clarity
TARGET_DIR="./protos"

echo "Cleaning existing target proto subdirectories (coingaming_protobuf and lab_protobuf)..."
rm -rf "$TARGET_DIR/coingaming_protobuf"
rm -rf "$TARGET_DIR/lab_protobuf"
# Also clean the new lab structure if it exists from a previous run
rm -rf "$TARGET_DIR/lab"

echo "Creating target directory if it doesn't exist..."
mkdir -p "$TARGET_DIR"

# Create the directory structure to match import paths
echo "Creating directory structure for imports..."
mkdir -p "$TARGET_DIR/coingaming_protobuf/substance/limits/reaction"
mkdir -p "$TARGET_DIR/coingaming_protobuf/substance/limits/element"
mkdir -p "$TARGET_DIR/coingaming_protobuf/substance/limits/observation"
mkdir -p "$TARGET_DIR/coingaming_protobuf/substance/limits/effect"
mkdir -p "$TARGET_DIR/coingaming_protobuf/global"
mkdir -p "$TARGET_DIR/lab_protobuf/global"

# Copy the proto files to the correct locations to match import paths
echo "Copying limit proto files from $CGP_SOURCE_DIR/substance/limits..."

# Copy main proto files
cp "$CGP_SOURCE_DIR/substance/limits"/*.proto "$TARGET_DIR/coingaming_protobuf/substance/limits/"

# Copy nested proto directories
echo "Copying nested proto directories..."
for DIR in reaction element observation effect; do
  if [ -d "$CGP_SOURCE_DIR/substance/limits/$DIR" ]; then
    cp "$CGP_SOURCE_DIR/substance/limits/$DIR"/*.proto "$TARGET_DIR/coingaming_protobuf/substance/limits/$DIR/"
  fi
done

# Copy global protos
echo "Copying global protos..."
cp "$CGP_SOURCE_DIR/global"/*.proto "$TARGET_DIR/coingaming_protobuf/global/" 2>/dev/null || true

# Copy lab_protobuf global files
echo "Copying lab_protobuf global files..."
if [ -d "$LAB_PROTO_SOURCE_DIR/lab_protobuf/global" ]; then
  cp "$LAB_PROTO_SOURCE_DIR/lab_protobuf/global/"*.proto "$TARGET_DIR/lab_protobuf/global/" 2>/dev/null || true
fi

# Copy lab_protobuf substance files (like site.proto)
echo "Copying lab_protobuf substance files..."
mkdir -p "$TARGET_DIR/lab_protobuf/substance/lab/element"
if [ -d "$LAB_PROTO_SOURCE_DIR/lab_protobuf/substance/lab/element" ]; then
  cp "$LAB_PROTO_SOURCE_DIR/lab_protobuf/substance/lab/element/"*.proto "$TARGET_DIR/lab_protobuf/substance/lab/element/" 2>/dev/null || true
fi

# Copy Google protobuf and elixirpb files
echo "Copying Google protobuf files..."
if [ -f "$LAB_PROTO_SOURCE_DIR/lab_protobuf/google_protobuf.proto" ]; then
  cp "$LAB_PROTO_SOURCE_DIR/lab_protobuf/google_protobuf.proto" "$TARGET_DIR/lab_protobuf/" 2>/dev/null || true
fi

if [ -f "$LAB_PROTO_SOURCE_DIR/lab_protobuf/elixirpb.proto" ]; then
  cp "$LAB_PROTO_SOURCE_DIR/lab_protobuf/elixirpb.proto" "$TARGET_DIR/lab_protobuf/" 2>/dev/null || true
fi

if [ -f "$LAB_PROTO_SOURCE_DIR/lab_protobuf/descriptor.proto" ]; then
  cp "$LAB_PROTO_SOURCE_DIR/lab_protobuf/descriptor.proto" "$TARGET_DIR/lab_protobuf/" 2>/dev/null || true
fi

echo "Creating target ./protos/lab structure for specific services and global types..."
mkdir -p "$TARGET_DIR/lab/reaction"
mkdir -p "$TARGET_DIR/lab/element"
# Note: global.proto for limits will go into $TARGET_DIR/lab directly, not $TARGET_DIR/lab/global

# Copy and rename reaction service proto
if [ -f "$CGP_SOURCE_DIR/substance/limits/reaction.proto" ]; then
  echo "Copying coingaming_protobuf/substance/limits/reaction.proto to $TARGET_DIR/lab/reaction/limits_service.proto"
  cp "$CGP_SOURCE_DIR/substance/limits/reaction.proto" "$TARGET_DIR/lab/reaction/limits_service.proto"
else
  echo "WARNING: $CGP_SOURCE_DIR/substance/limits/reaction.proto not found."
fi

# Copy and rename element service proto
echo "Copying coingaming_protobuf/substance/limits/element.proto to $TARGET_DIR/lab/element/limits_service.proto"
cp "$CGP_SOURCE_DIR/substance/limits/element.proto" "$TARGET_DIR/lab/element/limits_service.proto"

# Copy global.proto to lab directory for better output structure in generated files
if [ -f "$CGP_SOURCE_DIR/substance/limits/global.proto" ]; then
  echo "Copying coingaming_protobuf/substance/limits/global.proto to $TARGET_DIR/lab/global.proto"
  mkdir -p "$TARGET_DIR/lab"
  cp "$CGP_SOURCE_DIR/substance/limits/global.proto" "$TARGET_DIR/lab/global.proto"
fi

echo "Copying auth_flask protos..."
AUTH_PROTO_SOURCE="/Users/erkan.barin/Desktop/ApiCollection/auth_flask/lib/auth_flask/protos"
mkdir -p "$TARGET_DIR/auth_flask"
cp -R "$AUTH_PROTO_SOURCE"/*.proto "$TARGET_DIR/auth_flask/" 2>/dev/null || true

echo "Copying limits_flask protos..."
LIMITS_PROTO_SOURCE="/Users/erkan.barin/Desktop/ApiCollection/limits_flask/lib/limits_flask/protos"
mkdir -p "$TARGET_DIR/limits_flask" 
cp -R "$LIMITS_PROTO_SOURCE"/*.proto "$TARGET_DIR/limits_flask/" 2>/dev/null || true

echo "Copying lab_umbrella shared protos..."
LAB_UMBRELLA_SOURCE="/Users/erkan.barin/Desktop/ApiCollection/lab_umbrella/apps/*/lib/*_flask/protos"
mkdir -p "$TARGET_DIR/lab_umbrella"
cp -R $LAB_UMBRELLA_SOURCE/*.proto "$TARGET_DIR/lab_umbrella/" 2>/dev/null || true

echo "Proto sync completed."
