// server.js

// --- Imports ---
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const OktaJwtVerifier = require('@okta/jwt-verifier');
const jose = require('jose');

// --- App & Port Setup ---
const app = express();
const port = process.env.PORT || 3001;

// --- Core Configuration & Middleware ---
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

const oktaJwtVerifier = new OktaJwtVerifier({
  issuer: process.env.OKTA_ISSUER,
  clientId: process.env.OKTA_CLIENT_ID,
});

// --- Helper Functions ---
async function createClientAssertion() {
  const privateKey = JSON.parse(process.env.BFF_PRIVATE_KEY);
  const key = await jose.importJWK(privateKey, 'RS256');
  const clientId = process.env.BFF_CLIENT_ID;
  const tokenUrl = `${process.env.OKTA_ORG_URL}/oauth2/v1/token`;
  const assertion = await new jose.SignJWT({}).setProtectedHeader({ alg: 'RS256', kid: privateKey.kid }).setIssuer(clientId).setSubject(clientId).setAudience(tokenUrl).setJti(String(Math.random())).setExpirationTime('5m').setIssuedAt().sign(key);
  return assertion;
}
async function getBackendToken(scope) {
  const clientAssertion = await createClientAssertion();
  const tokenUrl = `${process.env.OKTA_ORG_URL}/oauth2/v1/token`;
  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');
  params.append('scope', scope);
  params.append('client_assertion_type', 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer');
  params.append('client_assertion', clientAssertion);
  const tokenResponse = await axios.post(tokenUrl, params, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
  return tokenResponse.data.access_token;
}

// --- Authentication Middleware ---
const authenticationRequired = async (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const match = authHeader.match(/Bearer (.+)/);
  if (!match) return res.status(401).send('Unauthorized: No token provided');
  try {
    const accessToken = match[1];
    await oktaJwtVerifier.verifyAccessToken(accessToken, 'api://default');
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).send(`Unauthorized: ${error.message}`);
  }
};

// --- API Endpoints ---
app.get('/api/groups', authenticationRequired, async (req, res) => {
  try {
    const backendToken = await getBackendToken('okta.groups.read');
    const apiUrl = `${process.env.OKTA_ORG_URL}/api/v1/groups`;
    const response = await axios.get(apiUrl, { headers: { 'Authorization': `Bearer ${backendToken}` } });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching Okta groups:', error);
    res.status(500).json({ error: 'Failed to fetch groups from Okta API.' });
  }
});

app.get('/api/assigned-labels', authenticationRequired, async (req, res) => {
  try {
    const { orn } = req.query;
    if (!orn) {
      return res.status(400).json({ error: 'ORN query parameter is required.' });
    }
    const backendToken = await getBackendToken('okta.governance.labels.read');
    const filter = `orn eq "${orn}"`;
    const apiUrl = `${process.env.OKTA_ORG_URL}/governance/api/v1/resource-labels?filter=${encodeURIComponent(filter)}`;
    
    const response = await axios.get(apiUrl, { headers: { 'Authorization': `Bearer ${backendToken}` } });
    
    const resources = response.data.data;
    const assignedLabels = (resources && resources.length > 0) ? resources[0].labels : [];
    
    res.json(assignedLabels);
  } catch (error) {
    console.error('Error fetching Okta assigned labels:', error);
    res.status(500).json({ error: 'Failed to fetch assigned labels from Okta API.' });
  }
});

// --- API Endpoints: Label Groups ---
app.get('/api/governance-labels', authenticationRequired, async (req, res) => {
  try {
    const backendToken = await getBackendToken('okta.governance.labels.read');
    const apiUrl = `${process.env.OKTA_ORG_URL}/governance/api/v1/labels`;
    const response = await axios.get(apiUrl, { headers: { 'Authorization': `Bearer ${backendToken}` } });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching Okta labels:', error);
    res.status(500).json({ error: 'Failed to fetch data from Okta API.' });
  }
});

app.post('/api/governance-labels', authenticationRequired, async (req, res) => {
  try {
    const { groupName, labelName, labelColor } = req.body;
    const oktaPayload = { name: groupName, values: [{ name: labelName, metadata: { additionalProperties: { backgroundColor: labelColor } } }] };
    const backendToken = await getBackendToken('okta.governance.labels.manage');
    const apiUrl = `${process.env.OKTA_ORG_URL}/governance/api/v1/labels`;
    const response = await axios.post(apiUrl, oktaPayload, { headers: { 'Authorization': `Bearer ${backendToken}` } });
    res.status(201).json(response.data);
  } catch (error) {
    console.error('Error creating Okta label:', error);
    res.status(500).json({ error: 'Failed to create label in Okta.' });
  }
});

app.patch('/api/governance-labels/:labelId', authenticationRequired, async (req, res) => {
  try {
    const { labelId } = req.params;
    const { name } = req.body;
    const backendToken = await getBackendToken('okta.governance.labels.manage');
    const governanceApiUrl = `${process.env.OKTA_ORG_URL}/governance/api/v1/labels/${labelId}`;
    const patchPayload = [{ op: 'REPLACE', path: '/name', value: name, refType: 'LABEL-CATEGORY' }];
    const updateResponse = await axios.patch(governanceApiUrl, patchPayload, {
      headers: { 'Authorization': `Bearer ${backendToken}`, 'Content-Type': 'application/json' },
    });
    res.json(updateResponse.data);
  } catch (error) {
    console.error('Error updating Okta label:', error);
    res.status(500).json({ error: 'Failed to update label in Okta.' });
  }
});

app.delete('/api/governance-labels/:labelId', authenticationRequired, async (req, res) => {
  try {
    const { labelId } = req.params;
    const backendToken = await getBackendToken('okta.governance.labels.manage');
    const apiUrl = `${process.env.OKTA_ORG_URL}/governance/api/v1/labels/${labelId}`;
    await axios.delete(apiUrl, { headers: { 'Authorization': `Bearer ${backendToken}` } });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting Okta label:', error);
    res.status(500).json({ error: 'Failed to delete label in Okta.' });
  }
});

// --- API Endpoints: Individual Label Values ---
app.post('/api/governance-labels/:labelId/values', authenticationRequired, async (req, res) => {
  try {
    const { labelId } = req.params;
    const { name, color } = req.body;
    const backendToken = await getBackendToken('okta.governance.labels.manage');
    const governanceApiUrl = `${process.env.OKTA_ORG_URL}/governance/api/v1/labels/${labelId}`;
    const patchPayload = [{
      op: 'ADD', path: '/values/-', refType: 'LABEL-VALUE',
      value: { name, metadata: { additionalProperties: { backgroundColor: color } } }
    }];
    const response = await axios.patch(governanceApiUrl, patchPayload, {
      headers: { 'Authorization': `Bearer ${backendToken}`, 'Content-Type': 'application/json' },
    });
    res.status(201).json(response.data);
  } catch (error) {
    console.error('Error adding Okta label value:', error);
    res.status(500).json({ error: 'Failed to add label value in Okta.' });
  }
});

app.patch('/api/governance-labels/:labelId/values/:valueId', authenticationRequired, async (req, res) => {
  try {
    const { labelId, valueId } = req.params;
    const { name, color } = req.body;
    const backendToken = await getBackendToken('okta.governance.labels.manage');
    const groupApiUrl = `${process.env.OKTA_ORG_URL}/governance/api/v1/labels/${labelId}`;
    const patchPayload = [
      { op: 'REPLACE', path: `/values/${valueId}/name`, value: { name: name }, refType: 'LABEL-VALUE' },
      { op: 'REPLACE', path: `/values/${valueId}/metadata/additionalProperties/backgroundColor`, value: { metadata: { additionalProperties: { backgroundColor: color } } }, refType: 'LABEL-VALUE' }
    ];
    const response = await axios.patch(groupApiUrl, patchPayload, {
      headers: { 'Authorization': `Bearer ${backendToken}`, 'Content-Type': 'application/json' },
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error updating Okta label value:', error);
    res.status(500).json({ error: 'Failed to update label value in Okta.' });
  }
});

app.delete('/api/governance-labels/:labelId/values/:valueId', authenticationRequired, async (req, res) => {
  try {
    const { valueId } = req.params;
    const backendToken = await getBackendToken('okta.governance.labels.manage');
    const valueApiUrl = `${process.env.OKTA_ORG_URL}/governance/api/v1/labels/${valueId}`;
    await axios.delete(valueApiUrl, {
      headers: { 'Authorization': `Bearer ${backendToken}` },
    });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting Okta label value:', error);
    res.status(500).json({ error: 'Failed to delete label value in Okta.' });
  }
});

// --- Server Start ---
app.listen(port, () => {
  console.log(`BFF server listening at http://localhost:${port}`);
});