import { credentials } from '@grpc/grpc-js';
import { connect } from '@ayonli/grpc-async';

/**
 * Creates an asynchronous gRPC client for the Auth Service
 * 
 * @param {string} address The gRPC server address (e.g., 'localhost:50051')
 * @returns {Object} An async wrapper around the Auth gRPC client
 */
export async function createAsyncAuthClient(address) {
  // This import path will need to be updated once you've generated stubs
  // The actual path depends on how your proto files are structured
  try {
    // Use dynamic import instead of require
    const module = await import('../../generated/lab/reaction/auth_service_grpc_pb.js');
    const { AuthServiceClient } = module; // Expecting AuthServiceClient from grpc-tools generated file
    
    // Use secure credentials for HTTPS URLs, insecure for localhost
    const useSecure = address.startsWith('https://');
    const creds = useSecure ? credentials.createSsl() : credentials.createInsecure();
    
    return connect(AuthServiceClient, address, creds); // AuthServiceClient should be a constructor
  } catch (error) {
    console.error(`Failed to create Auth client: ${error.message}`);
    console.error('Make sure you have generated stubs by running: npm run generate-stubs');
    throw error;
  }
} 