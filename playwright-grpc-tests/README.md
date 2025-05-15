# Playwright gRPC Test Automation Framework

A comprehensive framework for testing Elixir-based gRPC services using Playwright, following modern JavaScript (ESM) practices. This project specifically focuses on testing limits-related functionality in the LAB gateway.

## Project Structure

```
playwright-grpc-tests/
├── tests/                        # Test scripts organized by functionality
│   └── limits/                   # Limits-related tests
│       ├── limits_test.spec.js   # End-to-end limits test
│       └── simple_limits_test.spec.js # Simplified test for demonstration
├── protos/                       # Local copy of .proto files
│   ├── coingaming_protobuf/      # Coingaming proto files
│   └── lab_protobuf/             # Lab proto files
├── generated/                    # Auto-generated gRPC client stubs and messages
├── lib/                          # Reusable library code
│   ├── grpc-clients/             # Wrapper modules for gRPC services/clients
│   │   ├── auth_client.js        # Auth service client wrapper
│   │   └── limits_client.js      # Limits service client wrapper
│   └── utils/                    # Helper functions, test data generators
│       ├── jwt_helper.js         # JWT token handling utilities
│       ├── csv_helper.js         # CSV file handling utilities
│       └── test_data_generator.js # Test data generation utilities
├── scripts/                      # Utility scripts
│   └── sync_protos.sh            # Script to sync proto files from repositories
├── .env                          # Environment configuration
├── package.json                  # Project dependencies and scripts
└── playwright.config.js          # Playwright configuration
```

## Step-by-Step Guide to Creating a Test

### 1. Setting Up the Environment

1. Install dependencies:

   ```
   npm install
   ```

2. Create a `.env` file with the following content:
   ```
   LAB_GATEWAY_URL=localhost:50051
   SITE_ID=12
   OPERATOR_ID=2
   ```

### 2. Synchronizing Proto Files

Run the sync script to copy proto files from the repositories:

```
npm run sync-protos
```

### 3. Generating gRPC Client Stubs

Generate the client stubs from the proto files:

```
npm run generate-stubs
```

Note: If you encounter issues with the proto files, you may need to adjust the sync script or the proto import paths.

### 4. Creating a Test

Create a new test file in the `tests/` directory. Here's a basic structure for a gRPC test:

```javascript
import { test, expect } from '@playwright/test';
import * as grpc from '@grpc/grpc-js';
import dotenv from 'dotenv';

// Import client factory functions
import { createAsyncAuthClient } from '../../lib/grpc-clients/auth_client.js';
import { createAsyncLimitsClient } from '../../lib/grpc-clients/limits_client.js';

// Load environment variables
dotenv.config();

test.describe('My gRPC Test', () => {
  let authClient;
  let limitsClient;

  test.beforeAll(async () => {
    // Create gRPC clients
    authClient = createAsyncAuthClient(process.env.LAB_GATEWAY_URL);
    limitsClient = createAsyncLimitsClient(process.env.LAB_GATEWAY_URL);
  });

  test.afterAll(async () => {
    // Close client connections
    if (authClient) authClient.close();
    if (limitsClient) limitsClient.close();
  });

  test('My first gRPC test', async () => {
    // Create request object
    const request = new SomeRequest();
    request.setField('value');

    // Create metadata
    const metadata = new grpc.Metadata();
    metadata.set('site-id', process.env.SITE_ID);

    // Make gRPC call
    const response = await client.someMethod(request, metadata);

    // Assert on the response
    expect(response.getField()).toBe('expected value');
  });
});
```

### 5. Running Tests

Run all tests:

```
npm test
```

Run a specific test file:

```
npx playwright test tests/limits/simple_limits_test.spec.js
```

View the test report:

```
npm run show-report
```

### 6. Switching Between Environments

The tests can run against either a local environment or the t1 test environment. Update your `.env` file to point to the desired environment:

#### Local Environment

```
# Local environment
LAB_GATEWAY_URL=localhost:50051
SITE_ID=12
OPERATOR_ID=2
```

#### T1 Environment

```
# T1 environment
LAB_GATEWAY_URL=https://lab.t1-lab-lab.t1.testenv.io:50051
SITE_ID=12
OPERATOR_ID=2
```

You can also use the playwright.config.js file to set up different projects for each environment:

```javascript
// In playwright.config.js
projects: [
  {
    name: 'local',
    use: {
      // Local-specific configurations
    },
  },
  {
    name: 't1',
    use: {
      // T1-specific configurations
    },
  },
]
```

Then run tests against a specific environment:

```
npx playwright test --project=t1
```

## Testing Limits Functionality

The limits test flow follows these steps:

1. Create a new user via the Auth service
2. Extract the user ID and token from the response
3. Set initial weekly limit (€100) and monthly limit (€400)
4. Verify the limits were set correctly via the Element service
5. Decrease the limits to €50 (weekly) and €200 (monthly)
6. Verify the decreased limits
7. Request limit increases to €150 (weekly) and €300 (monthly)
8. Reject the weekly limit increase
9. Verify cooldown functionality

This flow is demonstrated in the `limits_test.spec.js` file.

## Troubleshooting

If you encounter issues with proto file imports, you may need to:

1. Adjust the `sync_protos.sh` script to copy additional files
2. Update the import paths in the proto files
3. Modify the `generate-stubs` script in `package.json` to include additional proto paths

If you have issues with the generated client stubs, you can start with the simplified test in `simple_limits_test.spec.js` which doesn't rely on the generated stubs.
