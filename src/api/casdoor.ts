// Direct Casdoor API calls (proxied via /casdoor)
const CASDOOR_ORG = 'OpenCSG'
const CASDOOR_APP = 'CSGHub'  // Casdoor application name (configured in backend)
const CASDOOR_CLIENT_ID = '7a97bc5168cb75ffc514'
const CASDOOR_URL = import.meta.env.VITE_CASDOOR_URL || 'http://10.100.18.37:8000'
const API_CALLBACK_URL = `${import.meta.env.VITE_API_BASE || 'http://10.100.18.37:8080'}/api/v1/callback/casdoor`

// Build Casdoor OAuth2 authorization URL for social login
// state=casdoor → csghub-server will redirect to signinSuccessRedirectURL?jwt=xxx
export function getOAuthUrl(provider: 'github' | 'google') {
  const params = new URLSearchParams({
    client_id: CASDOOR_CLIENT_ID,
    response_type: 'code',
    redirect_uri: API_CALLBACK_URL,
    scope: 'read',
    state: 'casdoor',
  })
  // Casdoor's provider-specific login shortcut
  return `${CASDOOR_URL}/login/${provider}?${params}`
}

async function casdoorPost(path: string, body: object) {
  const res = await fetch(`/casdoor${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return res.json()
}

export const sendEmailCode = (email: string) =>
  casdoorPost('/api/send-email', {
    type: 'Register',
    dest: email,
    emailAddress: email,
    organizationId: `admin/${CASDOOR_ORG}`,
    applicationId: `admin/${CASDOOR_APP}`,
  })

export const signupWithEmail = (params: {
  username: string
  email: string
  password: string
  emailCode: string
}) =>
  casdoorPost('/api/signup', {
    application: CASDOOR_APP,
    organization: CASDOOR_ORG,
    username: params.username,
    password: params.password,
    email: params.email,
    emailCode: params.emailCode,
  })
