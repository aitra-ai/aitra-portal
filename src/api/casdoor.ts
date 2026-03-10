// Direct Casdoor API calls (proxied via /casdoor)
const CASDOOR_ORG = 'OpenCSG'
const CASDOOR_APP = 'CSGHub'  // Casdoor application name (configured in backend)
const CASDOOR_CLIENT_ID = '7a97bc5168cb75ffc514'
const CASDOOR_URL = import.meta.env.VITE_CASDOOR_URL || 'http://10.100.18.37:8000'
const API_CALLBACK_URL = `${import.meta.env.VITE_API_BASE || 'http://10.100.18.37:8080'}/api/v1/callback/casdoor`

/**
 * Open Casdoor OAuth in a popup window.
 * Returns a Promise that resolves with the JWT string when auth completes,
 * or rejects on error / popup closed.
 */
export function oauthPopup(provider: 'github' | 'google'): Promise<string> {
  return new Promise((resolve, reject) => {
    const params = new URLSearchParams({
      client_id: CASDOOR_CLIENT_ID,
      response_type: 'code',
      redirect_uri: API_CALLBACK_URL,
      scope: 'read',
      state: 'casdoor',
    })
    const url = `${CASDOOR_URL}/login/${provider}?${params}`

    const width = 520
    const height = 620
    const left = window.screenX + (window.outerWidth - width) / 2
    const top = window.screenY + (window.outerHeight - height) / 2
    const popup = window.open(
      url,
      'oauth_popup',
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes`
    )

    if (!popup) {
      reject(new Error('Popup blocked. Please allow popups for this site.'))
      return
    }

    // Listen for postMessage from CallbackView
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      if (event.data?.type !== 'oauth_callback') return
      cleanup()
      if (event.data.jwt) {
        resolve(event.data.jwt)
      } else {
        reject(new Error(event.data.error || 'Authentication failed'))
      }
    }

    // Poll for popup closed without completing auth
    const pollTimer = setInterval(() => {
      if (popup.closed) {
        cleanup()
        reject(new Error('popup_closed'))
      }
    }, 500)

    function cleanup() {
      window.removeEventListener('message', onMessage)
      clearInterval(pollTimer)
    }

    window.addEventListener('message', onMessage)
  })
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
