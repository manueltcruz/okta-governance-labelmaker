// src/main.jsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, useNavigate } from 'react-router-dom';
import { Security } from '@okta/okta-react';
import { OktaAuth, toRelativeUrl } from '@okta/okta-auth-js';
import { OdysseyProvider } from '@okta/odyssey-react-mui';
import oktaConfig from './config';
import App from './App';
import './index.css';

const oktaAuth = new OktaAuth(oktaConfig);

const AppWithRouter = () => {
  const navigate = useNavigate();
  const restoreOriginalUri = async (_oktaAuth, originalUri) => {
    navigate(toRelativeUrl(originalUri || '/', window.location.origin));
  };

  return (
    <Security oktaAuth={oktaAuth} restoreOriginalUri={restoreOriginalUri}>
      <App />
    </Security>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <OdysseyProvider>
      <Router>
        <AppWithRouter />
      </Router>
    </OdysseyProvider>
  </React.StrictMode>
);
