<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4">
    <div class="fixed inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-40 -right-40 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-60" />
      <div class="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-100 rounded-full blur-3xl opacity-60" />
    </div>

    <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
      <button
        class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        @click="router.push('/')"
      >
        <el-icon :size="20"><Close /></el-icon>
      </button>

      <!-- Logo -->
      <div class="flex items-center gap-2 mb-6">
        <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <span class="text-white font-bold text-sm">A</span>
        </div>
        <span class="font-bold text-lg text-gray-900">aitra</span>
      </div>

      <h2 class="text-2xl font-bold text-gray-900 mb-6">{{ t('login.title') }}</h2>

      <!-- Social login -->
      <div class="space-y-3 mb-6">
        <button
          class="w-full flex items-center justify-center gap-3 h-11 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 disabled:opacity-50"
          :disabled="!!oauthLoading"
          @click="oauthLogin('github')"
        >
          <el-icon v-if="oauthLoading === 'github'" class="animate-spin"><Loading /></el-icon>
          <svg v-else class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
          </svg>
          {{ t('login.github') }}
        </button>

        <button
          class="w-full flex items-center justify-center gap-3 h-11 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 disabled:opacity-50"
          :disabled="!!oauthLoading"
          @click="oauthLogin('google')"
        >
          <svg class="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <el-icon v-if="oauthLoading === 'google'" class="animate-spin"><Loading /></el-icon>
          {{ t('login.google') }}
        </button>
      </div>

      <!-- Divider -->
      <div class="flex items-center gap-3 mb-6">
        <div class="flex-1 h-px bg-gray-200" />
        <span class="text-xs text-gray-400">{{ t('login.or') }}</span>
        <div class="flex-1 h-px bg-gray-200" />
      </div>

      <!-- Email form -->
      <el-form :model="form" :rules="rules" ref="formRef" @submit.prevent="handleLogin">
        <el-form-item prop="username" class="mb-4">
          <div class="text-sm text-gray-700 font-medium mb-1.5">{{ t('login.usernameOrEmail') }}</div>
          <el-input v-model="form.username" :placeholder="t('login.usernameOrEmailPlaceholder')" size="large" />
        </el-form-item>

        <el-form-item prop="password" class="mb-2">
          <div class="text-sm text-gray-700 font-medium mb-1.5">{{ t('login.password') }}</div>
          <el-input
            v-model="form.password"
            type="password"
            :placeholder="t('login.passwordPlaceholder')"
            size="large"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <el-alert v-if="errorMsg" :title="errorMsg" type="error" class="mb-4" :closable="false" show-icon />

        <el-button
          type="primary"
          size="large"
          class="w-full !mt-4 !h-11 !text-base font-semibold"
          :loading="loading"
          @click="handleLogin"
        >
          {{ t('login.submit') }}
        </el-button>
      </el-form>

      <div class="text-center text-sm text-gray-500 mt-5">
        {{ t('login.noAccount') }}
        <router-link to="/register" class="text-blue-500 hover:text-blue-600 font-medium ml-1">
          {{ t('login.register') }}
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth'
import { oauthPopup } from '../api/casdoor'

const { t } = useI18n()
const router = useRouter()
const auth = useAuthStore()

const formRef = ref()
const loading = ref(false)
const oauthLoading = ref<string | null>(null)
const errorMsg = ref('')
const form = reactive({ username: '', password: '' })
const rules = {
  username: [{ required: true, message: ' ', trigger: 'blur' }],
  password: [{ required: true, message: ' ', trigger: 'blur' }],
}

async function oauthLogin(provider: 'github' | 'google') {
  oauthLoading.value = provider
  errorMsg.value = ''
  try {
    const jwt = await oauthPopup(provider)
    const payload = JSON.parse(atob(jwt.split('.')[1] ?? ''))
    const username = payload.sub || payload.username || payload.name || 'user'
    localStorage.setItem('jwt_token', jwt)
    localStorage.setItem('user_info', JSON.stringify({ username }))
    auth.$patch({ token: jwt as any, userInfo: { username } as any })
    router.push('/app/models')
  } catch (err: any) {
    if (err?.message !== 'popup_closed') {
      errorMsg.value = err?.message || t('common.error')
    }
  } finally {
    oauthLoading.value = null
  }
}

async function handleLogin() {
  await formRef.value?.validate(async (valid: boolean) => {
    if (!valid) return
    loading.value = true
    errorMsg.value = ''
    try {
      await auth.login(form)
      router.push('/app/models')
    } catch {
      errorMsg.value = t('login.error')
    } finally {
      loading.value = false
    }
  })
}
</script>
