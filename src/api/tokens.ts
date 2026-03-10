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

export const createToken = (app: string, tokenName: string) =>
  api.put<{ data: Token }>(`/token/${app}/${tokenName}`)

export const deleteToken = (app: string, tokenName: string) =>
  api.delete(`/token/${app}/${tokenName}`)

export const getToken = (tokenValue: string) =>
  api.get(`/token/${tokenValue}`)
