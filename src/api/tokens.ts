import api from './index'

export interface Token {
  token_name: string
  token: string
  app: string
  created_at: string
  last_used_at?: string
}

export const listTokens = (username: string, app = 'git') =>
  api.get<{ data: Token[] }>(`/user/${username}/tokens`, { params: { app } })

export const createToken = (app: string, tokenName: string, expiredAt?: string) => {
  // expired_at: one year from now by default
  const expired = expiredAt || new Date(Date.now() + 365 * 86400000).toISOString()
  return api.post<{ data: Token }>(`/token/${app}/${tokenName}`, {
    name: tokenName,
    expired_at: expired,
  })
}

export const deleteToken = (app: string, tokenName: string) =>
  api.delete(`/token/${app}/${tokenName}`)

export const getToken = (tokenValue: string) =>
  api.get(`/token/${tokenValue}`)
