# Playwright gRPC Test Automation Framework

A comprehensive framework for testing Elixir-based gRPC services using Playwright, following modern JavaScript (ESM) practices.

## Directory Structure

```
playwright-grpc-tests/
├── tests/                        # Test scripts organized by RPC type
│   ├── unary/                    # Tests for unary RPCs
│   └── server-streaming/         # Tests for server-streaming RPCs
├── protos/                       # Local copy of .proto files
│   └── lab/                      # Namespace for 'LAB' gateway protos
├── generated/                    # Auto-generated gRPC client stubs and messages
│   └── lab/
├── lib/                          # Reusable library code
│   ├── grpc-clients/             # Wrapper modules for gRPC services/clients
│   └── utils/                    # Helper functions, test data generators
├── config/                       # Environment configurations
├── scripts/                      # Utility scripts
└── .github/                      # CI workflows
```

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Generate gRPC client stubs:
   ```
   npm run generate-stubs
   ```

3. Run the tests:
   ```
   npm test
   ```

## Environment Variables

Configure the following environment variables in a `.env` file:

- `LAB_GATEWAY_URL`: The gRPC gateway URL (default: `localhost:50051`)

## Available Scripts

- `npm run sync-protos`: Synchronize proto files from the central repository
- `npm run generate-stubs`: Generate gRPC client stubs from proto files
- `npm run lint`: Run ESLint for code quality
- `npm run format`: Format code using Prettier
- `npm test`: Run all tests
- `npm run show-report`: Show the Playwright test report

## Testing Strategies

This framework demonstrates testing strategies for different RPC types:

- **Unary RPCs**: Simple request-response tests
- **Server-Streaming RPCs**: Tests that handle streams of responses
- **Client-Streaming RPCs**: Tests that send streams of requests
- **Bidirectional-Streaming RPCs**: Tests that handle concurrent streams in both directions

## CI/CD Integration

This project includes GitHub Actions workflows for continuous integration.
