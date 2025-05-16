# gRPC Limits Service Testing with Flask Routing

This project demonstrates how to properly connect to and test the Limits gRPC service in a Lab Elixir environment, with a particular focus on solving the flask routing challenge.

## Key Discovery: Proper Flask Routing

The main discovery of this project is how to properly route gRPC requests to the correct flask instance:

**The target flask name must be specified in the `reaction` field of the context object.**

This is the critical insight that allows JavaScript clients to successfully route to the correct Elixir flask service.

## Setup Requirements

1. **Directory Structure**:

   - Ensure the `protos` directory is properly structured with all necessary proto files
   - Add SSL certificates in the `certs` directory

2. **SSL Certificates**:

   - Place the Lab public certificate at `certs/lab_public.pem`
   - This is required for secure connections to the gRPC server

3. **Environment Variables**:
   - Create a `.env` file with the following values:
     ```
     LAB_GATEWAY_URL=lab.t1-lab-lab.t1.testenv.io:50051
     SITE_ID=12
     OPERATOR_ID=3
     ```

## Running Tests

```bash
# Install dependencies
npm install

# Run tests
npm run test
```

## Flask Routing Solution

### Context Object Structure

The most critical part of the implementation is the correct structure of the Context object. Based on the `context.proto` definition and our investigation, it must include:

```javascript
const context = {
  operator_id: OPERATOR_ID,
  site_id: SITE_ID,
  source_flask_name: 'playwright_test_flask',
  nonce: Date.now(),

  // THIS IS THE KEY PART - reaction object with target_flask_name
  reaction: {
    target_flask_name: FLASK_NAME,
    flask_timeout: 60000,
    timeout: 30000,
  },

  // Must include proper user information
  subject_info: {
    user_token: USER.token,
    user_id: parseInt(USER.userId),
    site_ids: [SITE_ID],
  },
};
```

The `reaction.target_flask_name` field is crucial for the Lab gateway to correctly route the request to the appropriate flask service.

### Metadata Headers

Include the following metadata headers to complement the context object:

```javascript
const metadata = new grpc.Metadata();
metadata.set('site-id', SITE_ID.toString());
metadata.set('authorization', `Bearer ${USER.token}`);
metadata.set('x-flask', FLASK_NAME);
metadata.set('flask-name', FLASK_NAME);
```

### Implementation Examples

Two key files demonstrate the solution:

1. `tests/limits/final_routing_solution.spec.js`: Mock implementation that verifies the correct context structure
2. `tests/limits/refined_limits_test.spec.js`: Multiple approaches to real connections with the server

## Understanding the Solution

The solution is based on our analysis of the Elixir code in the Lab client library. We found that:

1. The Elixir code uses `Context.reaction_context()` to create a properly structured context
2. This context requires a `target_flask_name` in the `reaction` field
3. The Lab gateway uses this field to determine which flask should handle the request

By replicating this structure in JavaScript, we can ensure our requests are properly routed to the correct flask instance.

## Troubleshooting

### "NoFlaskInstancesError"

If you receive this error:

1. Verify that `target_flask_name` is correctly set in the `reaction` field of the context
2. Make sure the flask name is "casinoportal_pr_flask" for the limits service
3. Ensure the context object is properly structured according to the pattern above

### Connection Issues

If you can't connect to the server:

1. Check that you're using the correct credentials (SSL for secure connections)
2. Verify the server address is correctly formatted (no https:// prefix)
3. Confirm network connectivity to the T1 environment

## Proto Management

### buf.yaml

Create a proper `buf.yaml` configuration:

```yaml
version: v1
name: lab/protobuf
deps:
  - buf.build/googleapis/googleapis
breaking:
  use:
    - FILE
lint:
  use:
    - DEFAULT
```

### buf.gen.yaml

```yaml
version: v1
plugins:
  - plugin: js
    out: generated
    opt: import_style=commonjs,binary
  - plugin: grpc-js
    out: generated
    opt: import_style=commonjs,binary
```
