// src/components/OktaSignInWidget.jsx

import React, { useEffect, useRef } from 'react';
import OktaSignIn from '@okta/okta-signin-widget';
import '@okta/okta-signin-widget/css/okta-sign-in.min.css';
import oktaConfig from '../config';

const OktaSignInWidget = ({ onSuccess, onError }) => {
  const widgetRef = useRef(null);

  useEffect(() => {
    if (!widgetRef.current) {
      return;
    }

    // Instantiate the widget
    const widget = new OktaSignIn({
      baseUrl: oktaConfig.issuer.split('/oauth2')[0],
      clientId: oktaConfig.clientId,
      redirectUri: oktaConfig.redirectUri,
      authParams: {
        pkce: oktaConfig.pkce,
        issuer: oktaConfig.issuer,
        scopes: oktaConfig.scopes,
        //dpop: oktaConfig.dpop, // <-- ADD THIS LINE
      },
    });

    // Render the widget
    widget.showSignInToGetTokens({
      el: widgetRef.current,
    }).then(onSuccess).catch(onError);

    // Cleanup: remove the widget on component unmount
    return () => widget.remove();
  }, [onSuccess, onError]);

  return <div ref={widgetRef} />;
};

export default OktaSignInWidget;