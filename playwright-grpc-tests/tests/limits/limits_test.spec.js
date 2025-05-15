// tests/limits/limits_test.spec.js
const { test, expect } = require('@playwright/test');
const grpc = require('@grpc/grpc-js');
const dotenv = require('dotenv');

// Import client factory functions
const { createAsyncLimitsClient } = require('../../lib/grpc-clients/limits_client.js');

// Import utility functions
const { createMoneyMessage } = require('../../lib/utils/test_data_generator.js'); // Still need this for SetLimit

// Load environment variables
dotenv.config();

// Define mock SetLimitRequest class
class SetLimitRequest {
  constructor() {
    this._userId = '';
    this._siteId = 0;
    this._money = null;
    this._periodType = 0;
    this._limitType = 0;
  }

  setUserId(userId) {
    this._userId = userId;
    return this;
  }

  setSiteId(siteId) {
    this._siteId = siteId;
    return this;
  }

  setMoney(money) {
    this._money = money;
    return this;
  }

  setPeriodType(periodType) {
    this._periodType = periodType;
    return this;
  }

  setLimitType(limitType) {
    this._limitType = limitType;
    return this;
  }

  getUserId() {
    return this._userId;
  }

  getSiteId() {
    return this._siteId;
  }

  getMoney() {
    return this._money;
  }

  getPeriodType() {
    return this._periodType;
  }

  getLimitType() {
    return this._limitType;
  }
}

// Define enums
const PeriodType = {
  WEEK: 1,
  MONTH: 2,
  DAY: 3
};

const LimitType = {
  LOSS: 1,
  DEPOSIT: 2
};

test.describe('Simplified Limits API Test', () => {
  // Test configuration from environment variables
  const LAB_GATEWAY_ADDRESS = process.env.LAB_GATEWAY_URL || 'localhost:50051';
  const SITE_ID = parseInt(process.env.SITE_ID || '12');
  
  // Hardcoded existing user credentials from your Postman logs / existing test setup
  const EXISTING_USER = {
    username: 'limits_95796',
    email: 'onboarding+95796@yolo.com',
    userId: '13921',
    token: 'eyJhbGciOiJFUzI1NiIsImtpZCI6ImNjMGUwODEyLTU0NWUtNDBkNi05YTE4LTIwNzk4YTQ5NWRkOSIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJib21iYXljYXNpbm8uY29tIiwiZXhwIjoxNzQ3OTM0NzA0LCJpYXQiOjE3NDczMjk5MDUyODQsImlzcyI6ImNvaW5nYW1pbmciLCJqdGkiOiI1MDUyZTY4ZC0xYTgyLTQ4ZTYtYTc1YS0yMDNhNDQ4OGMwMGYiLCJzY29wZSI6InVzZXIiLCJzdWIiOiJsaW1pdHNfOTU3OTYiLCJzdWJJZCI6MTM5MjF9.iTKGofWAZLNQuY9uB5YjeuB5iU_yVEbMCrgBBzuyonY4ko4UIW66CCzNlJwss9NQn-KnGFyU0h6V-g92M-5yuA'
  };
  
  // Test state variables
  let limitsClient;
  const userId = EXISTING_USER.userId;
  const userToken = EXISTING_USER.token;
  
  // Setup: Runs once before all tests
  test.beforeAll(async () => {
    try {
      // Verify the imports worked correctly
      console.log('SetLimitRequest available:', !!SetLimitRequest);
      console.log('PeriodType available:', !!PeriodType);
      console.log('LimitType available:', !!LimitType);
      console.log('PeriodType.WEEK value:', PeriodType.WEEK);
      console.log('LimitType.LOSS value:', LimitType.LOSS);
      
      console.log('Successfully imported or mocked classes for SetLimit');
    } catch (error) {
      console.error(`Failed to import generated classes: ${error.message}`);
      throw error;
    }
    
    // Create gRPC clients
    limitsClient = await createAsyncLimitsClient(LAB_GATEWAY_ADDRESS);
    
    console.log(`Using existing user: ${EXISTING_USER.email} with ID: ${userId}`);
    console.log(`Token validity: ${userToken ? 'Valid' : 'Invalid'}`);
  });
  
  // Teardown: Runs once after all tests
  test.afterAll(async () => {
    if (limitsClient) limitsClient.close();
  });

  /**
   * Helper to set a limit (copied from original test, may need SetLimitRequest to be globally available)
   * @param {string} currentUserId User ID
   * @param {string} currentUserToken User token for authentication
   * @param {string} amountStr Amount as string
   * @param {PeriodType} periodTypeEnum Period type enum value
   * @param {LimitType} limitTypeEnum Limit type enum value
   * @returns {Promise<Object>} Set limit response
   */
  async function setLimitHelper(currentUserId, currentUserToken, amountStr, periodTypeEnum, limitTypeEnum) {
    if (!SetLimitRequest || !PeriodType || !LimitType) {
        throw new Error("Required request types or enums not imported/initialized for setLimitHelper. Check beforeAll.");
    }
    const request = new SetLimitRequest();
    request.setUserId(currentUserId);
    request.setSiteId(SITE_ID);
    request.setMoney(createMoneyMessage('EUR', amountStr));
    request.setPeriodType(periodTypeEnum);
    request.setLimitType(limitTypeEnum);
    
    const metadata = new grpc.Metadata();
    metadata.set('site-id', SITE_ID.toString());
    metadata.set('authorization', `Bearer ${currentUserToken}`);
    
    return limitsClient.setLimit(request, metadata);
  }

  test.only('Baby Step: Set a new weekly limit for existing user', async () => {
    console.log("\n=== Baby Step: Set a new weekly limit for existing user ===");
    const newWeeklyLimitAmount = "88"; // Using a distinct amount
    
    expect(userId).toBeDefined();
    expect(userToken).toBeDefined();
    expect(limitsClient).toBeDefined();
    expect(SetLimitRequest).toBeDefined();
    expect(PeriodType).toBeDefined();
    expect(LimitType).toBeDefined();
    expect(createMoneyMessage).toBeDefined();

    const setLimitResponse = await setLimitHelper(userId, userToken, newWeeklyLimitAmount, PeriodType.WEEK, LimitType.LOSS);
    expect(setLimitResponse.getSuccess()).toBe(true);
    console.log(`Set new weekly limit to ${newWeeklyLimitAmount} EUR. Response: ${JSON.stringify(setLimitResponse.toObject())}`);
    console.log("=============================================================\n");
  });
});
