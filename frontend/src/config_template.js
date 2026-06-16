// rename to config.js

const oktaConfig = {
  issuer: import.meta.env.VITE_OKTA_ISSUER,
  clientId: import.meta.env.VITE_OKTA_CLIENT_ID,
  redirectUri: import.meta.env.VITE_OKTA_REDIRECT_URI,
  scopes: (import.meta.env.VITE_OKTA_SCOPES || 'openid profile email').split(/\s+/),
  pkce: true,
};

export default oktaConfig;