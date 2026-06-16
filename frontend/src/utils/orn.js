const OKTA_PARTITION = import.meta.env.VITE_OKTA_PARTITION;
const OKTA_ORG_ID    = import.meta.env.VITE_OKTA_ORG_ID;

if (!OKTA_PARTITION || !OKTA_ORG_ID) {
  console.error(
    'Missing VITE_OKTA_PARTITION or VITE_OKTA_ORG_ID — ORN construction will produce invalid values.'
  );
}

export function buildGroupOrn(groupId) {
  return `orn:${OKTA_PARTITION}:directory:${OKTA_ORG_ID}:groups:${groupId}`;
}

export function buildAppOrn(appId, signOnMode) {
  const t = String(signOnMode || 'generic').toLowerCase();
  return `orn:${OKTA_PARTITION}:idp:${OKTA_ORG_ID}:apps:${t}:${appId}`;
}

export function buildEntitlementOrn(entitlementId) {
  return `orn:${OKTA_PARTITION}:governance:${OKTA_ORG_ID}:entitlements:${entitlementId}`;
}
