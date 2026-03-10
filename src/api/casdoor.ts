// Direct Casdoor API calls (proxied via /casdoor)
const CASDOOR_ORG = 'OpenCSG'
const CASDOOR_APP = 'CSGHub'

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
