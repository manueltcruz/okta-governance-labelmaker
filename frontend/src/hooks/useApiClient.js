import { useCallback } from 'react';
import { useOktaAuth } from '@okta/okta-react';

export function useApiClient() {
  const { oktaAuth } = useOktaAuth();

  const apiFetch = useCallback(async (url, options = {}) => {
    const accessToken = oktaAuth.getAccessToken();
    if (!accessToken) throw new Error('No access token available. Please re-authenticate.');

    const headers = { ...(options.headers || {}), Authorization: `Bearer ${accessToken}` };

    if (
      options.body &&
      typeof options.body === 'object' &&
      !(options.body instanceof FormData)
    ) {
      headers['Content-Type'] = headers['Content-Type'] || 'application/json';
    }

    const res = await fetch(url, {
      ...options,
      headers,
      body:
        options.body && headers['Content-Type'] === 'application/json'
          ? JSON.stringify(options.body)
          : options.body,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`API ${res.status} ${res.statusText}: ${text || '(no body)'}`);
    }

    if (res.status === 204) return null;

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) return res.text().catch(() => '');
    return res.json();
  }, [oktaAuth]);

  return apiFetch;
}
