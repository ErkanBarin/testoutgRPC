const { faker } = require('@faker-js/faker');

/**
 * Creates a random user request for registration
 * 
 * @returns {Object} Configuration object for creating a new request
 */
function createRandomUserRequest() {
  const timestamp = Math.floor(Date.now() / 1000);
  
  return {
    userUid: faker.string.hexadecimal({ length: 32 }).slice(2), // Remove 0x prefix
    email: `onboarding+${timestamp}@yolo.com`,
    password: "12345678",
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    locale: "EN_GB",
    acceptOffers: false,
    dateOfBirth: {
      year: 1990,
      month: 1,
      day: 1
    },
    userAgent: {
      userAgent: "browser",
      browser: {
        client: null,
        device: null,
        os: null
      }
    },
    emailTemplate: {
      subject: "WELCOME_EMAIL"
    },
    additionalParameters: {
      source: "tests",
      referral: "direct"
    }
  };
}

/**
 * Populates a request object with the configuration from createRandomUserRequest
 * 
 * @param {Object} request The proto-generated request object to populate
 * @param {Object} config Configuration from createRandomUserRequest
 * @returns {Object} The populated request object
 */
function populateRegisterRequest(request, config) {
  // For our mock implementation, we just need to set the basic fields
  request.setEmail(config.email);
  request.setPassword(config.password);
  request.setFirstName(config.firstName);
  request.setLastName(config.lastName);
  
  return request;
}

/**
 * Creates a Money message for use in limit requests
 * 
 * @param {string} currencyCode Currency code (e.g., 'EUR')
 * @param {string|number} amount Amount value
 * @returns {Object} Money message object
 */
function createMoneyMessage(currencyCode = 'EUR', amount) {
  // For our mock implementation, we just return a simple object
  return {
    currencyCode: currencyCode,
    amount: amount.toString(),
    // Add mock methods for the gRPC-style interface
    getCurrencyCode: () => currencyCode,
    getAmount: () => amount.toString()
  };
}

module.exports = {
  createRandomUserRequest,
  populateRegisterRequest,
  createMoneyMessage
}; 