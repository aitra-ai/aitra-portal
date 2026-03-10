<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
    <div class="bg-white rounded-2xl shadow-xl p-10 text-center max-w-sm w-full">
      <div v-if="error">
        <div class="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <el-icon class="text-red-500 text-2xl"><CircleClose /></el-icon>
        </div>
        <h3 class="font-semibold text-gray-900 mb-2">{{ t('callback.failed') }}</h3>
        <p class="text-sm text-gray-400 mb-6">{{ error }}</p>
        <el-button type="primary" @click="router.push('/login')">{{ t('callback.backToLogin') }}</el-button>
      </div>
      <div v-else>
        <div class="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <el-icon class="text-blue-500 text-2xl animate-spin"><Loading /></el-icon>
        </div>
        <p class="text-gray-500 text-sm">{{ t('callback.processing') }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const error = ref('')

onMounted(() => {
  // csghub-server redirects here with ?jwt=xxx after successful OAuth
  const jwt = (route.query.jwt ?? '') as string
  const errorCode = route.query.error_code as string
  const errorMsg = route.query.error_message as string

  if (errorCode || errorMsg) {
    error.value = decodeURIComponent(errorMsg || 'Authentication failed')
    return
  }

  if (!jwt) {
    error.value = 'No token received'
    return
  }

  // If opened as a popup, send JWT back to parent window and close
  if (window.opener) {
    window.opener.postMessage({ type: 'oauth_callback', jwt }, window.location.origin)
    window.close()
    return
  }

  // Fallback: normal page flow (e.g. direct URL access)
  try {
    const payload = JSON.parse(atob(jwt.split('.')[1]!))
    const username = payload.sub || payload.username || payload.name || 'user'
    localStorage.setItem('jwt_token', jwt as string)
    localStorage.setItem('user_info', JSON.stringify({ username }))
    auth.$patch({ token: jwt as any, userInfo: { username } as any })
    router.replace('/app/models')
  } catch {
    error.value = 'Failed to parse authentication token'
  }
})
</script>
