import api from './index'

export interface LoginParams {
  username: string
  password: string
}

export interface JwtResponse {
  token: string
  expire_at: string
  username: string
}

export const login = (params: LoginParams) =>
  api.post<{ data: JwtResponse }>('/login', params)

export const getUserInfo = (username: string) =>
  api.get(`/user/${username}`)
