import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as apiLogin, getUserInfo } from '../api/auth'
import type { LoginParams } from '../api/auth'

interface UserInfo {
  username: string
  nickname?: string
  avatar?: string
  email?: string
  roles?: string[]
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('jwt_token'))
  const userInfo = ref<UserInfo | null>(
    JSON.parse(localStorage.getItem('user_info') || 'null')
  )

  const isLoggedIn = computed(() => !!token.value)
  const username = computed(() => userInfo.value?.username ?? '')
  const isAdmin = computed(() => {
    const roles = userInfo.value?.roles ?? []
    return roles.includes('admin') || roles.includes('super_user')
  })

  async function login(params: LoginParams) {
    const res = await apiLogin(params)
    const data = res.data?.data || (res.data as any)
    const jwt = data?.token
    if (!jwt) throw new Error('No token in response')
    token.value = jwt
    // Use username from response, fallback to JWT payload
    const resolvedUsername = data?.username || (() => {
      try {
        const payload = JSON.parse(atob(jwt.split('.')[1]))
        return payload.sub || payload.username || params.username
      } catch { return params.username }
    })()
    const info: UserInfo = { username: resolvedUsername }
    userInfo.value = info
    localStorage.setItem('jwt_token', jwt)
    localStorage.setItem('user_info', JSON.stringify(info))
    // Fetch full user profile to get roles
    try {
      const profileRes = await getUserInfo(resolvedUsername)
      const profile = (profileRes.data as any)?.data ?? (profileRes.data as any)
      if (profile?.roles) {
        info.roles = profile.roles
        userInfo.value = { ...info }
        localStorage.setItem('user_info', JSON.stringify(info))
      }
    } catch { /* non-critical */ }
  }

  function logout() {
    token.value = null
    userInfo.value = null
    localStorage.removeItem('jwt_token')
    localStorage.removeItem('user_info')
  }

  return { token, userInfo, isLoggedIn, username, isAdmin, login, logout }
})
