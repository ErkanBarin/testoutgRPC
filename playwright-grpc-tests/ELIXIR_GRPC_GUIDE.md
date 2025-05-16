# Guide to JavaScript gRPC Clients for Elixir Services

This guide explains how to implement JavaScript gRPC clients that work correctly with Elixir-based gRPC services, focusing particularly on flask routing.

## Key Insight: Flask Routing in Elixir

The most critical discovery is that **Elixir services expect the target flask name in the `reaction.target_flask_name` field of the context object**.

This is essential for the Lab gateway to route requests to the correct flask instance.

## Context Structure

Based on the Elixir code analysis, here's the correct context structure:

```javascript
const context = {
  site_id: SITE_ID,
  operator_id: OPERATOR_ID,
  source_flask_name: 'source_flask_name',
  nonce: Date.now(),

  // THE KEY PART - reaction object with target_flask_name
  reaction: {
    target_flask_name: 'target_flask_name', // e.g., "auth_flask", "casinoportal_pr_flask"
    flask_timeout: 60000,
    timeout: 30000,
  },

  // Include subject info for authenticated requests
  subject_info: {
    user_id: USER_ID,
    user_token: AUTH_TOKEN,
    site_ids: [SITE_ID],
  },
};
```

## Common Mistakes

1. **Missing `reaction.target_flask_name`**: This will result in a `NoFlaskInstancesError` even if you include the flask name in:

   - Request metadata headers (`x-flask`, `flask-name`)
   - Top level context field

2. **Incorrectly structured context**: The subject_info and reaction objects must be structured exactly as shown above.

## Implementation Examples

Here's a typical implementation pattern:

```javascript
// Create a helper function for consistent context creation
function createReactionContext(options = {}) {
  return {
    site_id: options.site_id || SITE_ID,
    operator_id: options.operator_id || OPERATOR_ID,
    source_flask_name: 'playwright_test_flask',
    nonce: Date.now(),

    // Reaction with target flask name
    reaction: {
      target_flask_name: options.target_flask_name || DEFAULT_FLASK_NAME,
      flask_timeout: options.flask_timeout || 60000,
      timeout: options.timeout || 30000,
    },

    // Include subject_info if provided
    ...(options.subject_info && { subject_info: options.subject_info }),
  };
}

// Using the context helper
const context = createReactionContext({
  site_id: SITE_ID,
  operator_id: OPERATOR_ID,
  target_flask_name: LIMITS_FLASK_NAME,
  subject_info: {
    user_id: parseInt(USER.userId),
    user_token: USER.token,
    site_ids: [SITE_ID],
  },
});

// Create the full gRPC request
const request = {
  context: context,
  request: innerRequestData,
};

// Set metadata headers (still required for authentication, etc.)
const metadata = new grpc.Metadata();
metadata.set('site-id', SITE_ID.toString());
metadata.set('authorization', `Bearer ${USER.token}`);
metadata.set('x-flask', FLASK_NAME);
metadata.set('flask-name', FLASK_NAME);

// Make the gRPC call
client.SomeMethod(request, metadata, (error, response) => {
  // Handle response
});
```

## Authentication

For authenticated requests:

1. Set the JWT token in both places:

   - `metadata.set('authorization', 'Bearer ${token}')`
   - `context.subject_info.user_token = token`

2. Include user ID in the context:
   - `context.subject_info.user_id = parseInt(userId)`

## Debugging Flask Routing

If you're receiving a `NoFlaskInstancesError`:

1. Verify the `reaction.target_flask_name` is set correctly
2. Ensure the flask name matches a valid flask instance
3. Check that the context structure matches exactly what Elixir expects

## Error Codes

| Error Code                               | Meaning                  | Possible Cause                                 |
| ---------------------------------------- | ------------------------ | ---------------------------------------------- |
| 14 (UNAVAILABLE)                         | Connection issue         | Network problem, server down                   |
| 2 (UNKNOWN) with "NoFlaskInstancesError" | Flask routing error      | Missing/incorrect `reaction.target_flask_name` |
| 3 (INVALID_ARGUMENT)                     | Request validation error | Malformed request data                         |
| 16 (UNAUTHENTICATED)                     | Authentication error     | Invalid/missing token                          |

## Recommended Testing Approach

1. **Mock Tests**: Create mock clients to validate your request structure
2. **Real Tests with Proper Flask Routing**: Test with real connections once your mock tests pass

Remember, the key is ensuring that `reaction.target_flask_name` is properly set in every request context when communicating with Elixir gRPC services.
