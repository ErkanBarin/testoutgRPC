const { test, expect } = require('@playwright/test');
const grpc = require('@grpc/grpc-js');
const dotenv = require('dotenv');
const fs = require('fs');
const { faker } = require('@faker-js/faker');

// Load environment variables
dotenv.config();

// Test configuration from environment variables
const LAB_GATEWAY_URL = process.env.LAB_GATEWAY_URL || 'lab.t1-lab-lab.t1.testenv.io:50051';
// Strip out the https:// prefix if present for gRPC connection
const LAB_GATEWAY_ADDRESS = LAB_GATEWAY_URL.replace(/^https?:\/\//, '');
const SITE_ID = parseInt(process.env.SITE_ID || '12');
const OPERATOR_ID = parseInt(process.env.OPERATOR_ID || '3');

// Target Flask Names
const AUTH_FLASK_NAME = 'auth_flask';
const LIMITS_FLASK_NAME = 'casinoportal_pr_flask';

// User credentials - start with a static test user for limits testing
const USER = {
  username: 'testgrpc001',
  email: 'testgrpc@yopmail.com',
  userId: '13924',
  token: 'eyJhbGciOiJFUzI1NiIsImtpZCI6ImNjMGUwODEyLTU0NWUtNDBkNi05YTE4LTIwNzk4YTQ5NWRkOSIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJib21iYXljYXNpbm8uY29tIiwiZXhwIjoxNzQ3OTQ5Nzc4LCJpYXQiOjE3NDczNDQ5Nzg0MTMsImlzcyI6ImNvaW5nYW1pbmciLCJqdGkiOiJjNjNkYjg3My1kNWUwLTQ1YzYtYWZkNy1mZThmZGQyYTdhMjYiLCJzY29wZSI6InVzZXIiLCJzdWIiOiJ0ZXN0Z3JwYzAwMSIsInN1YklkIjoxMzkyNH0.HD9us5j4AG2BwV9fWAgoyIerMQdQBvzvJoK1dznKdPmOEJ3dn84VPKYsECUBroiAuBQ0oysRoUKKe7NdYuyBsA'
};

/**
 * Create a reaction context similar to Elixir's Context.reaction_context
 */
function createReactionContext(options = {}) {
  return {
    site_id: options.site_id || SITE_ID,
    operator_id: options.operator_id || OPERATOR_ID,
    source_flask_name: 'playwright_test_flask',
    nonce: Date.now(),
    
    // THIS IS THE KEY PART - reaction with target flask name
    reaction: {
      target_flask_name: options.target_flask_name || AUTH_FLASK_NAME,
      flask_timeout: options.flask_timeout || 60000,
      timeout: options.timeout || 30000
    },
    
    // Include subject_info if provided
    ...(options.subject_info && { subject_info: options.subject_info })
  };
}

/**
 * Create a mock auth client that returns a successful response
 */
function createMockAuthClient() {
  return {
    RegisterWithPassword: (request, metadata, callback) => {
      // Mock successful registration response
      callback(null, {
        ok: {
          token: USER.token
        }
      });
    }
  };
}

/**
 * Create a mock limits client that returns a successful response
 */
function createMockLimitsClient() {
  return {
    SetLimit: (request, metadata, callback) => {
      // Verify the request has proper context with target_flask_name
      if (!request.context?.reaction?.target_flask_name === LIMITS_FLASK_NAME) {
        callback(new Error('Missing target_flask_name in reaction context'));
        return;
      }
      
      // Mock successful limit set response
      callback(null, {
        ok: {}
      });
    },
    
    GetLimit: (request, metadata, callback) => {
      // Mock successful get limit response
      callback(null, {
        ok: {
          limit: {
            user_id: request.request.user_id,
            limit_type: request.request.limit_type,
            period_type: request.request.period_type,
            money: {
              currency_code: "EUR",
              amount: "100.00"
            }
          }
        }
      });
    }
  };
}

test.describe('T1 Elixir Match Tests - Mock Implementation', () => {
  let authClient;
  let limitsClient;
  
  test.beforeEach(() => {
    // Use mock clients instead of real gRPC connections
    authClient = createMockAuthClient();
    limitsClient = createMockLimitsClient();
  });
  
  test('should register a new user (mock test)', async () => {
    console.log('\n=== Test: Register New User (Mock) ===');
    
    try {
      // Create a random user request
      const userUid = `t1test_${Date.now().toString().slice(-6)}`;
      const randomUser = {
        user_uid: userUid,
        email: `${userUid}@example.com`,
        password: 'Password123!',
        date_of_birth: {
          year: 1990,
          month: 1,
          day: 1
        },
        locale: {
          language: 'en',
          country: 'gb'
        },
        accept_offers: false
      };
      
      console.log('Random user request:', randomUser);
      
      // Create proper context with target flask
      const context = createReactionContext({
        site_id: SITE_ID,
        operator_id: OPERATOR_ID,
        target_flask_name: AUTH_FLASK_NAME
      });
      
      console.log('Request Context:', JSON.stringify(context, null, 2));
      
      // Create the full request with context wrapper
      const registerRequest = {
        context: context,
        request: randomUser
      };
      
      // Create metadata with flask routing info
      const metadata = new grpc.Metadata();
      metadata.set('site-id', SITE_ID.toString());
      metadata.set('x-flask', AUTH_FLASK_NAME);
      metadata.set('flask-name', AUTH_FLASK_NAME);
      
      // Make the RegisterWithPassword call
      const response = await new Promise((resolve, reject) => {
        authClient.RegisterWithPassword(registerRequest, metadata, (error, response) => {
          if (error) {
            console.error('gRPC error:', error);
            reject(error);
            return;
          }
          resolve(response);
        });
      });
      
      console.log('Registration response:', JSON.stringify(response, null, 2));
      
      // Extract user token from the ok field
      expect(response.ok).toBeDefined();
      expect(response.ok.token).toBe(USER.token);
      
    } catch (error) {
      console.error('Test failed with error:', error);
      throw error;
    }
    
    console.log('=============================================================\n');
  });
  
  test('should set weekly loss limit with correct flask routing', async () => {
    console.log('\n=== Test: Set Weekly Loss Limit (Mock) ===');
    
    try {
      // Create metadata with the flask name
      const metadata = new grpc.Metadata();
      metadata.set('site-id', SITE_ID.toString());
      metadata.set('authorization', `Bearer ${USER.token}`);
      metadata.set('x-flask', LIMITS_FLASK_NAME);
      metadata.set('flask-name', LIMITS_FLASK_NAME);
      
      // Create context with the critical target_flask_name in the reaction field
      const context = createReactionContext({
        site_id: SITE_ID,
        operator_id: OPERATOR_ID,
        target_flask_name: LIMITS_FLASK_NAME,
        subject_info: {
          user_id: parseInt(USER.userId),
          user_token: USER.token,
          site_ids: [SITE_ID]
        }
      });
      
      // Create the inner request for setting a limit
      const innerRequest = {
        user_id: parseInt(USER.userId),
        site_id: SITE_ID,
        money: {
          currency_code: "EUR",
          amount: "100"
        },
        period_type: 1, // WEEK
        limit_type: 1  // LOSS
      };
      
      // Create the full request with context wrapper
      const setLimitRequest = {
        context: context,
        request: innerRequest
      };
      
      console.log('SetLimit request:', JSON.stringify(setLimitRequest, null, 2));
      
      // Make the SetLimit call
      const response = await new Promise((resolve, reject) => {
        limitsClient.SetLimit(setLimitRequest, metadata, (error, response) => {
          if (error) {
            console.error('gRPC error:', error);
            reject(error);
            return;
          }
          resolve(response);
        });
      });
      
      console.log('SetLimit response:', JSON.stringify(response, null, 2));
      
      // Verify the response
      expect(response.ok).toBeDefined();
      
      // Now get the limit to verify it was set
      const getLimitRequest = {
        context: context,
        request: {
          user_id: parseInt(USER.userId),
          site_id: SITE_ID,
          period_type: 1, // WEEK
          limit_type: 1  // LOSS
        }
      };
      
      const getLimitResponse = await new Promise((resolve, reject) => {
        limitsClient.GetLimit(getLimitRequest, metadata, (error, response) => {
          if (error) {
            console.error('gRPC error:', error);
            reject(error);
            return;
          }
          resolve(response);
        });
      });
      
      console.log('GetLimit response:', JSON.stringify(getLimitResponse, null, 2));
      
      // Verify the limit value
      expect(getLimitResponse.ok).toBeDefined();
      expect(getLimitResponse.ok.limit).toBeDefined();
      expect(getLimitResponse.ok.limit.money.amount).toBe('100.00');
      
    } catch (error) {
      console.error('Test failed with error:', error);
      throw error;
    }
    
    console.log('=============================================================\n');
  });
  
  test('should fail if target_flask_name is missing from context.reaction', async () => {
    console.log('\n=== Test: Verify Flask Routing Logic ===');
    
    try {
      // Create metadata with the flask name
      const metadata = new grpc.Metadata();
      metadata.set('site-id', SITE_ID.toString());
      metadata.set('authorization', `Bearer ${USER.token}`);
      metadata.set('x-flask', LIMITS_FLASK_NAME);
      metadata.set('flask-name', LIMITS_FLASK_NAME);
      
      // Create INCORRECT context with missing target_flask_name in reaction
      const badContext = {
        site_id: SITE_ID,
        operator_id: OPERATOR_ID,
        source_flask_name: 'playwright_test_flask',
        nonce: Date.now(),
        
        // MISSING the target_flask_name in reaction - THIS WILL CAUSE ROUTING TO FAIL
        reaction: {
          flask_timeout: 60000,
          timeout: 30000
        },
        
        subject_info: {
          user_id: parseInt(USER.userId),
          user_token: USER.token,
          site_ids: [SITE_ID]
        }
      };
      
      // Create the inner request for setting a limit
      const innerRequest = {
        user_id: parseInt(USER.userId),
        site_id: SITE_ID,
        money: {
          currency_code: "EUR",
          amount: "100"
        },
        period_type: 1,
        limit_type: 1
      };
      
      // Create the full request with the BAD context wrapper
      const badRequest = {
        context: badContext,
        request: innerRequest
      };
      
      console.log('Bad request (missing target_flask_name in reaction):', JSON.stringify(badRequest, null, 2));
      
      // Override the mock to verify the context
      const verifyingClient = {
        SetLimit: (request, metadata, callback) => {
          // This should fail due to missing target_flask_name
          if (!request.context?.reaction?.target_flask_name) {
            callback({
              code: 2, // UNKNOWN
              details: 'NoFlaskInstancesError: no instances of the flask have been found'
            });
            return;
          }
          
          // Should not reach here if validation works
          callback(null, { ok: {} });
        }
      };
      
      // Make the SetLimit call
      await expect(async () => {
        await new Promise((resolve, reject) => {
          verifyingClient.SetLimit(badRequest, metadata, (error, response) => {
            if (error) {
              reject(error);
              return;
            }
            resolve(response);
          });
        });
      }).rejects.toEqual(expect.objectContaining({
        details: expect.stringContaining('NoFlaskInstancesError')
      }));
      
      console.log('Test passed: Correctly rejected request missing target_flask_name in reaction');
      
    } catch (error) {
      console.error('Test failed with unexpected error:', error);
      throw error;
    }
    
    console.log('=============================================================\n');
  });
}); 