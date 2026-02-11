// Stub for retell-sdk webhook_auth module (server-side only, not needed in browser)
// This module is used for webhook signature verification which is done server-side
// These functions are not used in the browser, so we provide stub implementations

export const sign = () => {
  // Stub implementation - webhook signing is not needed in the browser
  return '';
};

export const verify = () => {
  // Stub implementation - webhook verification is not needed in the browser
  return true;
};

// Also export makeSecureWebhooks for compatibility
export const makeSecureWebhooks = () => {
  return {
    sign,
    verify,
  };
};

export default makeSecureWebhooks;
