#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

echo "Starting proto synchronization..."

# Local directory for proto files
LOCAL_PROTO_DIR="./protos"

# Clean up existing proto directory completely
echo "Cleaning up existing local protos in $LOCAL_PROTO_DIR..."
rm -rf "$LOCAL_PROTO_DIR"
mkdir -p "$LOCAL_PROTO_DIR"

# Create mock proto structure for testing
echo "Creating mock proto structure for integration testing..."

# Create necessary directories
mkdir -p "$LOCAL_PROTO_DIR/lab/reaction"
mkdir -p "$LOCAL_PROTO_DIR/lab/element"
mkdir -p "$LOCAL_PROTO_DIR/lab/common"

# Create the common types proto file
cat > "$LOCAL_PROTO_DIR/lab/common/common_types.proto" << 'EOF'
syntax = "proto3";

package lab.common;

// Money message for representing currency values
message Money {
  string currency_code = 1;
  string amount = 2;
}

// Period type enum for time periods
enum PeriodType {
  PERIOD_TYPE_UNSPECIFIED = 0;
  WEEK = 1;
  MONTH = 2;
  DAY = 3;
}

// Limit type enum
enum LimitType {
  LIMIT_TYPE_UNSPECIFIED = 0;
  LOSS = 1;
  DEPOSIT = 2;
}
EOF

# Create limits service proto for reaction
cat > "$LOCAL_PROTO_DIR/lab/reaction/limits_service.proto" << 'EOF'
syntax = "proto3";

package lab.reaction;

import "lab/common/common_types.proto";

// ReactionLimitsService provides methods to manage user limits
service ReactionLimitsService {
  // SetLimit sets a limit for a user
  rpc SetLimit(SetLimitRequest) returns (SetLimitResponse);
  
  // GetLimits retrieves limits for a user
  rpc GetLimits(GetLimitsRequest) returns (GetLimitsResponse);
}

// Request for setting a user limit
message SetLimitRequest {
  string user_id = 1;
  int32 site_id = 2;
  lab.common.Money money = 3;
  int32 period_type = 4;
  int32 limit_type = 5;
}

// Response for setting a limit
message SetLimitResponse {
  bool success = 1;
  string message = 2;
}

// Request for getting user limits
message GetLimitsRequest {
  string user_id = 1;
  int32 site_id = 2;
  int32 period_type = 3; // Optional
}

// Response containing user limits
message GetLimitsResponse {
  repeated LimitModel limits = 1;
}

// Model representing a user limit
message LimitModel {
  string id = 1;
  string user_id = 2;
  int32 period_type = 3;
  lab.common.Money amount = 4;
  int32 limit_type = 5;
}
EOF

# Create limits element service proto
cat > "$LOCAL_PROTO_DIR/lab/element/limits_element.proto" << 'EOF'
syntax = "proto3";

package lab.element;

import "lab/common/common_types.proto";

// LimitsElementService provides methods to query limit data
service LimitsElementService {
  // GetLimits retrieves limits for a user using filters
  rpc GetLimits(GetLimitsRequest) returns (GetLimitsResponse);
}

// Request for getting limits with filters
message GetLimitsRequest {
  LimitsFilter filter = 1;
}

// Filter for querying limits
message LimitsFilter {
  string user_id = 1;
  int32 period_type = 2; // Optional
}

// Response with limits data
message GetLimitsResponse {
  repeated LimitModel models = 1;
}

// Model representing a limit from storage
message LimitModel {
  string id = 1;
  string user_id = 2;
  int32 period_type = 3;
  lab.common.Money active_amount = 4;
  int32 limit_type = 5;
  string created_at = 6;
  string updated_at = 7;
}
EOF

echo "Mock proto files created successfully in $LOCAL_PROTO_DIR"
echo "Directory structure:"
find "$LOCAL_PROTO_DIR" -type f | sort
