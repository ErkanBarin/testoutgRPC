const { test, expect } = require('@playwright/test');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');

// Load environment variables
dotenv.config();

// Test configuration from environment variables
const LAB_GATEWAY_ADDRESS = process.env.LAB_GATEWAY_URL || 'lab.t1-lab-lab.t1.testenv.io:50051';
const SITE_ID = parseInt(process.env.SITE_ID || '12');
const OPERATOR_ID = parseInt(process.env.OPERATOR_ID || '3');
const FLASK_NAME = 'casinoportal_pr_flask'; // From error logs, this is the target flask

// User credentials from the newly generated test user
const USER = {
  username: 'testgrpc001',
  email: 'testgrpc@yopmail.com',
  userId: '13924',
  token: 'eyJhbGciOiJFUzI1NiIsImtpZCI6ImNjMGUwODEyLTU0NWUtNDBkNi05YTE4LTIwNzk4YTQ5NWRkOSIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJib21iYXljYXNpbm8uY29tIiwiZXhwIjoxNzQ3OTQ5Nzc4LCJpYXQiOjE3NDczNDQ5Nzg0MTMsImlzcyI6ImNvaW5nYW1pbmciLCJqdGkiOiJjNjNkYjg3My1kNWUwLTQ1YzYtYWZkNy1mZThmZGQyYTdhMjYiLCJzY29wZSI6InVzZXIiLCJzdWIiOiJ0ZXN0Z3JwYzAwMSIsInN1YklkIjoxMzkyNH0.HD9us5j4AG2BwV9fWAgoyIerMQdQBvzvJoK1dznKdPmOEJ3dn84VPKYsECUBroiAuBQ0oysRoUKKe7NdYuyBsA'
};

// Subscriber ID from error logs
const SUBSCRIBER_ID = '4e1c780e-6efb-45a9-a757-3d36cb7d7e82';

test.describe('Refined Limits API Test (with Flask Name)', () => {
  
  test('should set limit with direct protoLoader approach', async () => {
    // Make sure we have the proper gRPC address (no https:// prefix)
    const grpcAddress = LAB_GATEWAY_ADDRESS.replace(/^https?:\/\//, '');
    
    try {
      // Load proto definitions dynamically
      const packageDefinition = await protoLoader.load(
        // Load the main reaction.proto file which has the service definition
        path.resolve(__dirname, '../../protos/substance/limits/reaction.proto'),
        {
          keepCase: true,
          longs: String,
          enums: String,
          defaults: true,
          oneofs: true,
          includeDirs: [
            // Include the root protos directory
            path.resolve(__dirname, '../../protos')
          ]
        }
      );
      
      const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
      
      // Get the Service defined in reaction.proto
      const LimitsService = protoDescriptor.Lab.Rpc.Limits.Reaction.Service;
      
      // Create gRPC client
      const client = new LimitsService(
        grpcAddress,
        grpc.credentials.createInsecure()
      );
      
      // Create comprehensive metadata based on error logs
      const metadata = new grpc.Metadata();
      metadata.set('site-id', SITE_ID.toString());
      metadata.set('authorization', `Bearer ${USER.token}`);
      metadata.set('x-flask', FLASK_NAME);
      metadata.set('flask-name', FLASK_NAME);
      metadata.set('subscriber-id', SUBSCRIBER_ID);
      
      // Create proper ReactionContext based on context.proto structure
      const reactionContext = {
        target_flask_name: FLASK_NAME
      };
      
      // Create SubjectInfo based on context.proto structure
      const subjectInfo = {
        user_id: parseInt(USER.userId),
        user_token: USER.token,
        site_ids: [SITE_ID]
      };
      
      // Create Context as defined in context.proto
      const context = {
        site_id: SITE_ID,
        source_flask_name: FLASK_NAME,
        operator_id: OPERATOR_ID,
        reaction: reactionContext,
        subject_info: subjectInfo
      };
      
      // Create the inner request as defined in set_limit.proto
      const innerRequest = {
        user_id: parseInt(USER.userId),
        site_id: SITE_ID,
        money: {
          currency_code: "EUR",
          amount: "100" 
        },
        period_type: 1, // WEEK (numeric value per Global.PeriodTypeValue)
        limit_type: 1  // LOSS (numeric value per Global.LimitTypeValue)
      };
      
      // Create the outer request with proper context wrapper
      const setLimitRequest = {
        context: context,
        request: innerRequest
      };
      
      console.log('Sending SetLimit request with context:', JSON.stringify(setLimitRequest, null, 2));
      
      // Make gRPC call with promisification
      const response = await new Promise((resolve, reject) => {
        client.SetLimit(setLimitRequest, metadata, (error, response) => {
          if (error) {
            console.log('gRPC error details:', {
              code: error.code,
              details: error.details,
              metadata: error.metadata ? error.metadata.toJSON() : {}
            });
            reject(error);
          } else {
            resolve(response);
          }
        });
      });
      
      // We expect this to succeed if our adjustments worked
      console.log('SetLimit Response:', response);
      expect(response.ok).toBeDefined();
      
    } catch (error) {
      // Log comprehensive error information
      console.error('Error Code:', error.code);
      console.error('Error Details:', error.details);
      console.error('Error Metadata:', error.metadata ? error.metadata.toJSON() : 'No metadata');
      
      // The test should fail, but we want to see the exact error
      expect(error).toBeNull();
    }
  });

  test('should set limit with direct gRPC client and proper flask+context', async () => {
    // This test uses a more direct approach with the raw gRPC client
    const grpcAddress = LAB_GATEWAY_ADDRESS.replace(/^https?:\/\//, '');
    
    // Create metadata with the flask name
    const metadata = new grpc.Metadata();
    metadata.set('site-id', SITE_ID.toString());
    metadata.set('authorization', `Bearer ${USER.token}`);
    metadata.set('x-flask', FLASK_NAME);  // Try various versions
    metadata.set('flask-name', FLASK_NAME);
    metadata.set('target-flask-name', FLASK_NAME);
    
    // Create proper Context as per context.proto
    const context = {
      site_id: SITE_ID,
      source_flask_name: FLASK_NAME,
      operator_id: OPERATOR_ID,
      // Use ReactionContext structure from context.proto
      reaction: {
        target_flask_name: FLASK_NAME
      },
      // Use SubjectInfo structure from context.proto
      subject_info: {
        user_id: parseInt(USER.userId),
        user_token: USER.token, 
        site_ids: [SITE_ID]
      }
    };
    
    // Create the inner request
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
    const fullRequest = {
      context: context,
      request: innerRequest
    };
    
    try {
      // Use direct gRPC client for more control
      const client = new grpc.Client(
        grpcAddress,
        grpc.credentials.createInsecure()
      );
      
      console.log('Sending request with direct client:', JSON.stringify(fullRequest, null, 2));
      
      // Make direct unary request
      const response = await new Promise((resolve, reject) => {
        client.makeUnaryRequest(
          '/Lab.Rpc.Limits.Reaction.Service/SetLimit',
          (param) => Buffer.from(JSON.stringify(param)),
          (resp) => JSON.parse(resp.toString()),
          fullRequest,
          metadata,
          {},
          (error, response) => {
            if (error) {
              console.error('Direct gRPC error:', error);
              reject(error);
            } else {
              resolve(response);
            }
          }
        );
      });
      
      console.log('SetLimit Response (direct client):', response);
      expect(response.ok).toBeDefined();
      
    } catch (error) {
      console.error('Direct Client Error:', {
        code: error.code, 
        details: error.details,
        metadata: error.metadata ? error.metadata.toJSON() : {}
      });
      expect(error).toBeNull();
    }
  });

  test('should set limit with grpcurl-like plain approach', async () => {
    // This test attempts to mimic grpcurl's approach with minimal dependencies
    const grpcAddress = LAB_GATEWAY_ADDRESS.replace(/^https?:\/\//, '');
    
    // Create a transport channel
    const channel = new grpc.Channel(
      grpcAddress,
      grpc.credentials.createInsecure(),
      {
        'grpc.max_receive_message_length': 1024 * 1024 * 10, // 10MB
        'grpc.max_send_message_length': 1024 * 1024 * 10 // 10MB
      }
    );
    
    // Create metadata with all essential headers
    const metadata = new grpc.Metadata();
    metadata.set('site-id', SITE_ID.toString());
    metadata.set('authorization', `Bearer ${USER.token}`);
    metadata.set('x-flask', FLASK_NAME);
    metadata.set('flask-name', FLASK_NAME);
    metadata.set('source-flask-name', FLASK_NAME);
    metadata.set('target-flask-name', FLASK_NAME);
    metadata.set('content-type', 'application/grpc+proto');
    
    // Create a plain request with no class dependencies
    const plainRequest = {
      context: {
        site_id: SITE_ID,
        source_flask_name: FLASK_NAME,
        operator_id: OPERATOR_ID,
        reaction: {
          target_flask_name: FLASK_NAME
        },
        subject_info: {
          user_id: parseInt(USER.userId),
          user_token: USER.token,
          site_ids: [SITE_ID]
        }
      },
      request: {
        user_id: parseInt(USER.userId),
        site_id: SITE_ID,
        money: {
          currency_code: "EUR",
          amount: "100"
        },
        period_type: 1, // WEEK
        limit_type: 1   // LOSS
      }
    };
    
    try {
      // Create a client from the channel
      const client = new grpc.Client(channel);
      
      console.log('Sending plain request:', JSON.stringify(plainRequest, null, 2));
      
      // Make direct unary request with minimal assumptions
      const response = await new Promise((resolve, reject) => {
        client.makeUnaryRequest(
          '/Lab.Rpc.Limits.Reaction.Service/SetLimit',
          (param) => Buffer.from(JSON.stringify(param)),
          (resp) => JSON.parse(resp.toString()),
          plainRequest,
          metadata,
          {},
          (error, response) => {
            if (error) {
              reject(error);
            } else {
              resolve(response);
            }
          }
        );
      });
      
      console.log('SetLimit Response (plain approach):', response);
      expect(response.ok).toBeDefined();
      
    } catch (error) {
      console.error('Plain Approach Error:', {
        code: error.code, 
        details: error.details,
        metadata: error.metadata ? error.metadata.toJSON() : {}
      });
      expect(error).toBeNull();
    }
  });
}); 