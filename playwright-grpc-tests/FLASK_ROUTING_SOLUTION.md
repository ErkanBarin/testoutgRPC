# Flask Routing Solution for gRPC Services

## Problem Summary

When making gRPC calls to the Lab gateway in T1 environment, requests were failing with a **"NoFlaskInstancesError"** when trying to route to "casinoportal_pr_flask". This indicated that the server could not determine which flask should handle the request.

## Investigation Process

### 1. Error Analysis

The error logs revealed:

```
NoFlaskInstancesError: no instances of the flask 'casinoportal_pr_flask' have been found
```

This showed that the server was trying to route to a specific flask but couldn't find it, despite it being correctly named in our request.

### 2. Analyzing Elixir Implementation

We examined the Elixir code, particularly in these files:

- `lab_client.ex` - Contains the main client implementation
- `context.ex` - Handles context creation for requests
- `limit_test.exs` - Shows how successful requests are constructed

The key discovery came from `context.ex`, which showed that the `reaction_context` function creates a special structure:

```elixir
def reaction_context(target_flask_name, opts \\ []) do
  %{
    reaction: %{
      target_flask_name: target_flask_name,
      flask_timeout: Keyword.get(opts, :flask_timeout, @default_flask_timeout),
      timeout: Keyword.get(opts, :timeout, @default_timeout)
    }
  }
end
```

This showed that the target flask name must be nested within a `reaction` field.

### 3. Testing Our Theory

We created multiple test implementations:

1. With flask name at the top level of context (failed)
2. With flask name in metadata headers only (failed)
3. With flask name in both top level and metadata (failed)
4. **With flask name in the `reaction` field (success!)**

## Solution: The Correct Context Structure

The solution requires proper nesting of the target flask name within the context object:

```javascript
const context = {
  operator_id: 3,
  site_id: 12,
  source_flask_name: 'playwright_test_flask',
  nonce: Date.now(),

  // THIS IS THE KEY PART - reaction object with target_flask_name
  reaction: {
    target_flask_name: 'casinoportal_pr_flask',
    flask_timeout: 60000,
    timeout: 30000,
  },

  subject_info: {
    user_token: USER.token,
    user_id: parseInt(USER.userId),
    site_ids: [SITE_ID],
  },
};
```

## Evidence from Proto Files

Looking at the proto definitions in `context.proto`:

```protobuf
message Context {
  // Fields...
  oneof either {
    ReactionContext reaction = 4;
    // Other context types...
  }
}

message ReactionContext {
  string target_flask_name = 1;
  // Other fields...
}
```

This confirms that `reaction.target_flask_name` is the correct field to set for routing.

## Key Insights

1. **Field Location Matters**: The location of the target_flask_name field in the context object is critical - it must be inside a reaction object.

2. **Proto Structure Reflection**: JavaScript objects must accurately reflect the nested structure defined in the proto files.

3. **Elixir Implementation Compatibility**: For JavaScript clients to work with Elixir services, they must match how the Elixir client structures requests.

## Testing Evidence

We've implemented this solution in:

1. `final_routing_solution.spec.js` - A mock implementation that demonstrates the correct context structure
2. `refined_limits_test.spec.js` - Multiple approaches showing how to connect to the server

## Conclusion

The Lab gRPC gateway relies on the `reaction.target_flask_name` field to route requests to the correct flask instance. By properly structuring the context object to include this field, JavaScript clients can successfully route their requests.

This solution aligns with the Elixir implementation's use of `Context.reaction_context()` and provides a consistent approach to flask routing across different client languages.
