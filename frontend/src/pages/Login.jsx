import React from 'react';
import { Navigate } from 'react-router-dom';
import { useOktaAuth } from '@okta/okta-react';
import OktaSignInWidget from '../components/OktaSignInWidget';

const Login = () => {
  const { oktaAuth, authState } = useOktaAuth();

  const onSuccess = (tokens) => oktaAuth.handleLoginRedirect(tokens);
  const onError = (err) => console.error('Sign in error:', err);

  if (authState?.isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1 style={{ fontWeight: 400 }}>Okta Identity Governance Label Manager</h1>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '30px' }}>
        <OktaSignInWidget onSuccess={onSuccess} onError={onError} />
      </div>
    </div>
  );
};

export default Login;