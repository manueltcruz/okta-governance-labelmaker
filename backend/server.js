/**
 * backend/server.js
 *
 * Loads environment variables from the repo-root .env file
 * and serves the React build in production.
 */

const path = require('path');
const express = require('express');
const dotenv = require('dotenv');
const OktaJwtVerifier = require('@okta/jwt-verifier');
const cors = require('cors');
const axios = require('axios');
const jose = require('jose');

/* ------------------------------------------------------------------
 * Load ROOT .env (not backend/.env)
 * ------------------------------------------------------------------ */

dotenv.config({
  path: path.join(__dirname, '..', '.env'),
});

/* ------------------------------------------------------------------
 * Validate required environment variables early
 * ------------------------------------------------------------------ */

const REQUIRED_ENV_VARS = [
  'OKTA_ISSUER',
  'OKTA_CLIENT_ID',      // SPA client id (for validating user access tokens)
  'OKTA_ORG_URL',        // https://{yourOktaDomain}
  'BFF_CLIENT_ID',       // service app client id (client_credentials)
  'BFF_PRIVATE_KEY',     // JWK JSON string for private key (sig)
];

REQUIRED_ENV_VARS.forEach((key) => {
  if (!process.env[key]) {
    console.error(`❌ Missing required env var: ${key}`);
    process.exit(1);
  }
});

/* ------------------------------------------------------------------
 * App + Okta verifier setup
 * ------------------------------------------------------------------ */

const app = express();
const PORT = process.env.PORT || 3001;

const oktaJwtVerifier = new OktaJwtVerifier({
  issuer: process.env.OKTA_ISSUER,
  clientId: process.env.OKTA_CLIENT_ID,
});

/* ------------------------------------------------------------------
 * Middleware
 * ------------------------------------------------------------------ */

app.use(express.json());

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

/* ------------------------------------------------------------------
 * Authentication middleware (validates the USER access token from SPA)
 * ------------------------------------------------------------------ */

const authenticationRequired = async (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const match = authHeader.match(/Bearer (.+)/);
  if (!match) return res.status(401).json({ error: 'Missing Authorization header' });

  try {
    const accessToken = match[1];
    // Audience depends on your Okta setup; api://default is common for the default AS.
    await oktaJwtVerifier.verifyAccessToken(accessToken, 'api://default');
    next();
  } catch (error) {
    console.error('Authentication error:', error?.message || error);
    return res.status(401).json({ error: `Unauthorized: ${error.message}` });
  }
};

/* ------------------------------------------------------------------
 * Okta Service App token helpers (client_credentials w/ private_key_jwt)
 * ------------------------------------------------------------------ */

async function createClientAssertion() {
  const privateKey = JSON.parse(process.env.BFF_PRIVATE_KEY);
  const key = await jose.importJWK(privateKey, 'RS256');

  const clientId = process.env.BFF_CLIENT_ID;
  const tokenUrl = `${process.env.OKTA_ORG_URL}/oauth2/v1/token`;

  const assertion = await new jose.SignJWT({})
    .setProtectedHeader({ alg: 'RS256', kid: privateKey.kid })
    .setIssuer(clientId)
    .setSubject(clientId)
    .setAudience(tokenUrl)
    .setJti(String(Math.random()))
    .setExpirationTime('5m')
    .setIssuedAt()
    .sign(key);

  return assertion;
}

async function getServiceToken(scope) {
  const clientAssertion = await createClientAssertion();
  const tokenUrl = `${process.env.OKTA_ORG_URL}/oauth2/v1/token`;

  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');
  params.append('scope', scope);
  params.append('client_assertion_type', 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer');
  params.append('client_assertion', clientAssertion);

  const tokenResponse = await axios.post(tokenUrl, params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  return tokenResponse.data.access_token;
}

/* ------------------------------------------------------------------
 * API routes
 * ------------------------------------------------------------------ */

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

/**
 * Governance Labels
 * NOTE: These routes call Okta Governance APIs using the SERVICE token (client_credentials).
 */

app.get('/api/governance-labels', authenticationRequired, async (_req, res) => {
  try {
    const backendToken = await getServiceToken('okta.governance.labels.read');
    const apiUrl = `${process.env.OKTA_ORG_URL}/governance/api/v1/labels`;
    const response = await axios.get(apiUrl, {
      headers: { Authorization: `Bearer ${backendToken}` },
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching Okta labels:', error?.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to fetch data from Okta API.',
      detail: error?.response?.data || error.message,
    });
  }
});

app.post('/api/governance-labels', authenticationRequired, async (req, res) => {
  try {
    const { groupName, labelName, labelColor } = req.body;

    const oktaPayload = {
      name: groupName,
      values: [
        {
          name: labelName,
          metadata: {
            additionalProperties: {
              backgroundColor: labelColor,
            },
          },
        },
      ],
    };

    const backendToken = await getServiceToken('okta.governance.labels.manage');
    const apiUrl = `${process.env.OKTA_ORG_URL}/governance/api/v1/labels`;

    const response = await axios.post(apiUrl, oktaPayload, {
      headers: { Authorization: `Bearer ${backendToken}` },
    });

    res.status(201).json(response.data);
  } catch (error) {
    console.error('Error creating Okta label:', error?.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to create label in Okta.',
      detail: error?.response?.data || error.message,
    });
  }
});

app.patch('/api/governance-labels/:labelId', authenticationRequired, async (req, res) => {
  try {
    const { labelId } = req.params;
    const { name } = req.body;

    const backendToken = await getServiceToken('okta.governance.labels.manage');
    const governanceApiUrl = `${process.env.OKTA_ORG_URL}/governance/api/v1/labels/${labelId}`;

    const patchPayload = [{ op: 'REPLACE', path: '/name', value: name, refType: 'LABEL-CATEGORY' }];

    const updateResponse = await axios.patch(governanceApiUrl, patchPayload, {
      headers: { Authorization: `Bearer ${backendToken}`, 'Content-Type': 'application/json' },
    });

    res.json(updateResponse.data);
  } catch (error) {
    console.error('Error updating Okta label:', error?.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to update label in Okta.',
      detail: error?.response?.data || error.message,
    });
  }
});

app.delete('/api/governance-labels/:labelId', authenticationRequired, async (req, res) => {
  try {
    const { labelId } = req.params;
    const backendToken = await getServiceToken('okta.governance.labels.manage');

    const apiUrl = `${process.env.OKTA_ORG_URL}/governance/api/v1/labels/${labelId}`;
    await axios.delete(apiUrl, { headers: { Authorization: `Bearer ${backendToken}` } });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting Okta label:', error?.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to delete label in Okta.',
      detail: error?.response?.data || error.message,
    });
  }
});

app.post('/api/governance-labels/:labelId/values', authenticationRequired, async (req, res) => {
  try {
    const { labelId } = req.params;
    const { name, color } = req.body;

    const backendToken = await getServiceToken('okta.governance.labels.manage');
    const governanceApiUrl = `${process.env.OKTA_ORG_URL}/governance/api/v1/labels/${labelId}`;

    const patchPayload = [
      {
        op: 'ADD',
        path: '/values/-',
        refType: 'LABEL-VALUE',
        value: {
          name,
          metadata: { additionalProperties: { backgroundColor: color } },
        },
      },
    ];

    const response = await axios.patch(governanceApiUrl, patchPayload, {
      headers: { Authorization: `Bearer ${backendToken}`, 'Content-Type': 'application/json' },
    });

    res.status(201).json(response.data);
  } catch (error) {
    console.error('Error adding Okta label value:', error?.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to add label value in Okta.',
      detail: error?.response?.data || error.message,
    });
  }
});

app.patch(
  '/api/governance-labels/:labelId/values/:valueId',
  authenticationRequired,
  async (req, res) => {
    try {
      const { labelId, valueId } = req.params;
      const { name, color } = req.body;

      const backendToken = await getServiceToken('okta.governance.labels.manage');
      const groupApiUrl = `${process.env.OKTA_ORG_URL}/governance/api/v1/labels/${labelId}`;

      const patchPayload = [
        { op: 'REPLACE', path: `/values/${valueId}/name`, value: { name }, refType: 'LABEL-VALUE' },
        {
          op: 'REPLACE',
          path: `/values/${valueId}/metadata/additionalProperties/backgroundColor`,
          value: { metadata: { additionalProperties: { backgroundColor: color } } },
          refType: 'LABEL-VALUE',
        },
      ];

      const response = await axios.patch(groupApiUrl, patchPayload, {
        headers: { Authorization: `Bearer ${backendToken}`, 'Content-Type': 'application/json' },
      });

      res.json(response.data);
    } catch (error) {
      console.error('Error updating Okta label value:', error?.response?.data || error.message);
      res.status(500).json({
        error: 'Failed to update label value in Okta.',
        detail: error?.response?.data || error.message,
      });
    }
  }
);

app.delete(
  '/api/governance-labels/:labelId/values/:valueId',
  authenticationRequired,
  async (req, res) => {
    try {
      // NOTE: If your Okta tenant supports a dedicated value delete endpoint, wire it here.
      // Many tenants handle value operations via PATCH on the label category itself.
      const { labelId, valueId } = req.params;

      const backendToken = await getServiceToken('okta.governance.labels.manage');
      const groupApiUrl = `${process.env.OKTA_ORG_URL}/governance/api/v1/labels/${labelId}`;

      // If your existing implementation is different, keep it; otherwise this is a safe default.
      const patchPayload = [
        { op: 'REMOVE', path: `/values/${valueId}`, value: {}, refType: 'LABEL-VALUE' },
      ];

      const response = await axios.patch(groupApiUrl, patchPayload, {
        headers: { Authorization: `Bearer ${backendToken}`, 'Content-Type': 'application/json' },
      });

      res.json(response.data);
    } catch (error) {
      console.error('Error deleting Okta label value:', error?.response?.data || error.message);
      res.status(500).json({
        error: 'Failed to delete label value in Okta.',
        detail: error?.response?.data || error.message,
      });
    }
  }
);

/**
 * Groups + resource label assignments
 */

app.get('/api/groups', authenticationRequired, async (_req, res) => {
  try {
    const backendToken = await getServiceToken('okta.groups.read');
    const apiUrl = `${process.env.OKTA_ORG_URL}/api/v1/groups`;

    const response = await axios.get(apiUrl, {
      headers: { Authorization: `Bearer ${backendToken}` },
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error fetching Okta groups:', error?.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to fetch groups from Okta API.',
      detail: error?.response?.data || error.message,
    });
  }
});

app.get('/api/assigned-labels', authenticationRequired, async (req, res) => {
  try {
    const { orn } = req.query;
    if (!orn) return res.status(400).json({ error: 'ORN query parameter is required.' });

    const backendToken = await getServiceToken('okta.governance.labels.read');
    const filter = `orn eq "${orn}"`;
    const apiUrl = `${process.env.OKTA_ORG_URL}/governance/api/v1/resource-labels?filter=${encodeURIComponent(
      filter
    )}`;

    const response = await axios.get(apiUrl, {
      headers: { Authorization: `Bearer ${backendToken}` },
    });

    const resources = response.data?.data;
    const assignedLabels = resources && resources.length > 0 ? resources[0].labels : [];

    res.json(assignedLabels);
  } catch (error) {
    console.error('Error fetching Okta assigned labels:', error?.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to fetch assigned labels from Okta API.',
      detail: error?.response?.data || error.message,
    });
  }
});

/**
 * Assign labels to resources (Okta expects POST /resource-labels/assign)
 */
app.post('/api/assignments', authenticationRequired, async (req, res) => {
  try {
    const { orn, labelValueId } = req.body;

    if (!orn || !labelValueId) {
      return res.status(400).json({ error: 'orn and labelValueId are required' });
    }

    const backendToken = await getServiceToken('okta.governance.labels.manage');
    const oktaUrl = `${process.env.OKTA_ORG_URL}/governance/api/v1/resource-labels/assign`;

    const oktaPayload = {
      resourceOrns: [orn],
      labelValueIds: [labelValueId],
    };

    const response = await axios.post(oktaUrl, oktaPayload, {
      headers: {
        Authorization: `Bearer ${backendToken}`,
        'Content-Type': 'application/json',
      },
    });

    return res.json(response.data);
  } catch (error) {
    console.error('❌ Error assigning labels:', error?.response?.data || error.message);
    return res.status(500).json({
      error: 'Failed to assign labels via Okta Governance API.',
      detail: error?.response?.data || error.message,
    });
  }
});

/**
 * UNASSIGN labels from resources
 *
 * Your frontend calls DELETE /api/assignments, but Okta requires:
 *   POST /governance/api/v1/resource-labels/unassign   (with JSON body)
 * :contentReference[oaicite:1]{index=1}
 */
app.delete('/api/assignments', authenticationRequired, async (req, res) => {
  try {
    const body = req.body || {};

    const resourceOrns = Array.isArray(body.resourceOrns)
      ? body.resourceOrns
      : body.orn
        ? [body.orn]
        : body.resourceOrn
          ? [body.resourceOrn]
          : [];

    const labelValueIds = Array.isArray(body.labelValueIds)
      ? body.labelValueIds
      : body.labelValueId
        ? [body.labelValueId]
        : [];

    if (!Array.isArray(resourceOrns) || resourceOrns.length === 0) {
      return res.status(400).json({
        error: 'resourceOrns is required (array) or provide orn/resourceOrn (string).',
      });
    }

    if (!Array.isArray(labelValueIds) || labelValueIds.length === 0) {
      return res.status(400).json({
        error: 'labelValueIds is required (array) or provide labelValueId (string).',
      });
    }

    const backendToken = await getServiceToken('okta.governance.labels.manage');
    const oktaUrl = `${process.env.OKTA_ORG_URL}/governance/api/v1/resource-labels/unassign`;

    const oktaPayload = { resourceOrns, labelValueIds };

    const response = await axios.post(oktaUrl, oktaPayload, {
      headers: {
        Authorization: `Bearer ${backendToken}`,
        'Content-Type': 'application/json',
      },
    });

    return res.json(response.data);
  } catch (error) {
    console.error('❌ Error unassigning labels:', error?.response?.data || error.message);
    return res.status(500).json({
      error: 'Failed to unassign labels via Okta Governance API.',
      detail: error?.response?.data || error.message,
    });
  }
});

/**
 * GET /api/apps
 * All Okta apps, paginated.
 */
app.get('/api/apps', authenticationRequired, async (_req, res) => {
  try {
    const token = await getServiceToken('okta.apps.read');
    const all   = [];
    let url     = `${process.env.OKTA_ORG_URL}/api/v1/apps?limit=200`;
    while (url) {
      const r    = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      all.push(...(r.data || []));
      const next = (r.headers?.link || '').match(/<([^>]+)>;\s*rel="next"/);
      url = next ? next[1] : null;
    }
    res.json(all);
  } catch (error) {
    console.error('Error fetching apps:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch apps.', detail: error?.response?.data || error.message });
  }
});

/**
 * GET /api/apps/entitlement-enabled
 * Only apps where settings.emOptInStatus === "ENABLED".
 * Per Okta docs, emOptInStatus lives directly under settings (not settings.app).
 */
app.get('/api/apps/entitlement-enabled', authenticationRequired, async (_req, res) => {
  try {
    const token = await getServiceToken('okta.apps.read');
    const all   = [];
    let url     = `${process.env.OKTA_ORG_URL}/api/v1/apps?limit=200`;
    while (url) {
      const r    = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      all.push(...(r.data || []));
      const next = (r.headers?.link || '').match(/<([^>]+)>;\s*rel="next"/);
      url = next ? next[1] : null;
    }

    const enabled = all.filter(a =>
      a?.settings?.emOptInStatus === 'ENABLED' ||
      a?.settings?.app?.emOptInStatus === 'ENABLED'
    );

    console.log(`entitlement-enabled: ${enabled.length} / ${all.length} apps`);
    if (enabled.length === 0 && all.length > 0) {
      // Log settings of first few apps to help diagnose the correct path
      console.log('DEBUG settings sample:', JSON.stringify(
        all.slice(0, 3).map(a => ({ name: a.label, settings: a.settings })), null, 2
      ));
    }

    res.json(enabled);
  } catch (error) {
    console.error('Error fetching entitlement-enabled apps:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch entitlement-enabled apps.', detail: error?.response?.data || error.message });
  }
});

/**
 * GET /api/apps/:appId/entitlements
 * Entitlements for a specific app via the IGA governance endpoint.
 */
app.get('/api/apps/:appId/entitlements', authenticationRequired, async (req, res) => {
  try {
    const { appId } = req.params;
    const token     = await getServiceToken('okta.governance.entitlements.read');
    const filter    = `parent.externalId eq "${appId}" AND parent.type eq "APPLICATION"`;
    const url       = `${process.env.OKTA_ORG_URL}/governance/api/v1/entitlements?limit=100&filter=${encodeURIComponent(filter)}`;

    const r     = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
    const data  = r.data;
    // API returns { data: [...], _links: {...}, metadata: {...} }
    const items = Array.isArray(data?.data)  ? data.data
      : Array.isArray(data?.value)           ? data.value
      : Array.isArray(data)                  ? data
      : [];

    console.log(`entitlements for ${appId}: ${items.length} found`);
    res.json(items);
  } catch (error) {
    console.error('Error fetching app entitlements:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch entitlements.', detail: error?.response?.data || error.message });
  }
});

/**
 * GET /api/entitlements/:entitlementId/values
 * Fetch all individual values for a given entitlement category.
 * These are the labelable leaf-level resources with their own ORNs.
 * e.g. GET /governance/api/v1/entitlements/{id}/values
 */
app.get('/api/entitlements/:entitlementId/values', authenticationRequired, async (req, res) => {
  try {
    const { entitlementId } = req.params;
    const token = await getServiceToken('okta.governance.entitlements.read');
    const url   = `${process.env.OKTA_ORG_URL}/governance/api/v1/entitlements/${entitlementId}/values?limit=200`;

    const r     = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
    const data  = r.data;
    const items = Array.isArray(data?.data)  ? data.data
      : Array.isArray(data?.value)           ? data.value
      : Array.isArray(data)                  ? data
      : [];

    console.log(`entitlement values for ${entitlementId}: ${items.length} found`);
    res.json(items);
  } catch (error) {
    console.error('Error fetching entitlement values:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch entitlement values.', detail: error?.response?.data || error.message });
  }
});

/**
 * GET /api/label-search?labelValueId=xxx
 * Returns all resources tagged with a given label value.
 * Calls GET /governance/api/v1/resource-labels?filter=labelValueId eq "{id}"
 * Scope: okta.governance.labels.manage (already required for existing label routes)
 */
app.get('/api/label-search', authenticationRequired, async (req, res) => {
  try {
    const { labelValueId } = req.query;
    if (!labelValueId) return res.status(400).json({ error: 'labelValueId query param is required.' });

    const token  = await getServiceToken('okta.governance.labels.manage');
    const filter = `labelValueId eq "${labelValueId}"`;
    const all    = [];
    const PAGE   = 100;
    let   url    = `${process.env.OKTA_ORG_URL}/governance/api/v1/resource-labels?limit=${PAGE}&filter=${encodeURIComponent(filter)}`;

    while (url) {
      const r    = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      const data = r.data;
      const items = Array.isArray(data?.data) ? data.data
        : Array.isArray(data)                 ? data
        : [];
      all.push(...items);

      const link = r.headers?.link || '';
      const next = link.match(/<([^>]+)>;\s*rel="next"/);
      url = next ? next[1] : null;
    }

    console.log(`label-search: ${all.length} resources found for labelValueId=${labelValueId}`);
    res.json(all);
  } catch (error) {
    console.error('Error in label-search:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Failed to search by label.', detail: error?.response?.data || error.message });
  }
});

/* ------------------------------------------------------------------
 * Serve React build in production
 * ------------------------------------------------------------------ */

if (process.env.NODE_ENV === 'production') {
  const frontendDistPath = path.join(__dirname, '..', 'frontend', 'dist');

  app.use(express.static(frontendDistPath));

  app.get('*', (_req, res) => {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

/* ------------------------------------------------------------------
 * Start server
 * ------------------------------------------------------------------ */

app.listen(PORT, () => {
  console.log(`✅ Backend listening on port ${PORT}`);
  console.log(`✅ NODE_ENV=${process.env.NODE_ENV || 'development'}`);
});