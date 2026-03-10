import api from './index'

export interface LoginParams {
  login_name: string
  password: string
}

export interface JwtResponse {
  token: string
}

export const login = (params: LoginParams) =>
  api.post<{ data: JwtResponse }>('/jwt/token', params)

export const getUserInfo = (username: string) =>
  api.get(`/user/${username}`)
