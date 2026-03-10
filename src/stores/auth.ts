import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as apiLogin } from '../api/auth'
import type { LoginParams } from '../api/auth'

interface UserInfo {
  username: string
  nickname?: string
  avatar?: string
  email?: string
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('jwt_token'))
  const userInfo = ref<UserInfo | null>(
    JSON.parse(localStorage.getItem('user_info') || 'null')
  )

  const isLoggedIn = computed(() => !!token.value)
  const username = computed(() => userInfo.value?.username ?? '')

  async function login(params: LoginParams) {
    const res = await apiLogin(params)
    const jwt = res.data?.data?.token || (res.data as any)?.token
    if (!jwt) throw new Error('No token in response')
    token.value = jwt
    // Decode username from JWT payload
    try {
      const payload = JSON.parse(atob(jwt.split('.')[1]))
      const info: UserInfo = { username: payload.sub || payload.username || params.login_name }
      userInfo.value = info
      localStorage.setItem('jwt_token', jwt)
      localStorage.setItem('user_info', JSON.stringify(info))
    } catch {
      userInfo.value = { username: params.login_name }
      localStorage.setItem('jwt_token', jwt)
      localStorage.setItem('user_info', JSON.stringify({ username: params.login_name }))
    }
  }

  function logout() {
    token.value = null
    userInfo.value = null
    localStorage.removeItem('jwt_token')
    localStorage.removeItem('user_info')
  }

  return { token, userInfo, isLoggedIn, username, login, logout }
})
