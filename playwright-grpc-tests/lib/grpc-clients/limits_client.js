const { credentials } = require('@grpc/grpc-js');

/**
 * Creates an asynchronous gRPC client for the Limits Reaction Service
 * 
 * @param {string} address The gRPC server address (e.g., 'localhost:50051')
 * @returns {Object} A mock wrapper around the Limits Reaction gRPC client
 */
function createAsyncLimitsClient(address) {
  console.log(`Creating mock Limits client for ${address}`);
  
  // Return a mock client implementation
  return {
    setLimit: (request, metadata) => {
      console.log(`Mock setLimit called with request:`, {
        userId: request.getUserId(),
        siteId: request.getSiteId(),
        money: request.getMoney(),
        periodType: request.getPeriodType(),
        limitType: request.getLimitType()
      });
      
      console.log(`Metadata: authorization=${metadata.get('authorization')}, site-id=${metadata.get('site-id')}`);
      
      // Return a mock response
      return Promise.resolve({
        getSuccess: () => true,
        getMessage: () => "Limit set successfully",
        toObject: () => ({
          success: true,
          message: "Limit set successfully"
        })
      });
    },
    close: () => console.log('Mock Limits client closed')
  };
}

/**
 * Creates an asynchronous gRPC client for the Limits Element Service
 * 
 * @param {string} address The gRPC server address
 * @returns {Object} A mock wrapper around the Limits Element gRPC client
 */
async function createAsyncLimitsElementClient(address) {
  console.log(`Creating mock Limits Element client for ${address}`);
  
  // Create a mock client that simulates the getLimits method
  return {
    getLimits: (request, metadata) => {
      console.log(`Mock getLimits called with filter: ${JSON.stringify(request.getFilter())}`);
      console.log(`Metadata: authorization=${metadata.get('authorization')}, site-id=${metadata.get('site-id')}`);
      
      // Return a mock response
      return Promise.resolve({
        getModels: () => [
          {
            getId: () => '12345',
            getUserId: () => request.getFilter().getUserId(),
            getPeriodType: () => 1, // WEEK
            getActiveAmount: () => ({
              getAmount: () => '100',
              getCurrencyCode: () => 'EUR'
            })
          },
          {
            getId: () => '67890',
            getUserId: () => request.getFilter().getUserId(),
            getPeriodType: () => 2, // MONTH
            getActiveAmount: () => ({
              getAmount: () => '400',
              getCurrencyCode: () => 'EUR'
            })
          }
        ],
        toObject: () => ({
          models: [
            {
              id: '12345',
              userId: request.getFilter().getUserId(),
              periodType: 1, // WEEK
              activeAmount: {
                amount: '100',
                currencyCode: 'EUR'
              }
            },
            {
              id: '67890',
              userId: request.getFilter().getUserId(),
              periodType: 2, // MONTH
              activeAmount: {
                amount: '400',
                currencyCode: 'EUR'
              }
            }
          ]
        })
      });
    },
    close: () => console.log('Mock Limits Element client closed')
  };
}

module.exports = {
  createAsyncLimitsClient,
  createAsyncLimitsElementClient
}; 