// rename to config.js

const oktaConfig = {
  issuer: '[YOUR_OKTA_AUTH_SERVER]',
  clientId: '[YOUR_OKTA_APPLICATION_CLIENT_ID]',
  redirectUri: `${window.location.origin}/login/callback`,
  scopes: ['openid', 'profile', 'email'],
  pkce: true, // Use Proof Key for Code Exchange (PKCE) for better security
  dpop: false,
};

export default oktaConfig;