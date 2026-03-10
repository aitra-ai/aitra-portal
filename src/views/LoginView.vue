<template>
  <!-- Full-screen backdrop -->
  <div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4">
    <!-- Background blobs -->
    <div class="fixed inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-40 -right-40 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-60" />
      <div class="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-100 rounded-full blur-3xl opacity-60" />
    </div>

    <!-- Card -->
    <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
      <!-- Close / back to home -->
      <button
        class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        @click="router.push('/')"
      >
        <el-icon :size="20"><Close /></el-icon>
      </button>

      <h2 class="text-2xl font-bold text-gray-900 mb-6">{{ t('login.title') }}</h2>

      <el-form :model="form" :rules="rules" ref="formRef" @submit.prevent="handleLogin">
        <!-- Username / Email -->
        <el-form-item prop="login_name" class="mb-4">
          <div class="text-sm text-gray-700 font-medium mb-1.5">{{ t('login.usernameOrEmail') }}</div>
          <el-input
            v-model="form.login_name"
            :placeholder="t('login.usernameOrEmailPlaceholder')"
            size="large"
          />
        </el-form-item>

        <!-- Password -->
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

      <!-- Divider -->
      <div class="flex items-center gap-3 my-5">
        <div class="flex-1 h-px bg-gray-200" />
        <span class="text-xs text-gray-400">{{ t('login.or') }}</span>
        <div class="flex-1 h-px bg-gray-200" />
      </div>

      <!-- Register link -->
      <div class="text-center text-sm text-gray-500">
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

const { t } = useI18n()
const router = useRouter()
const auth = useAuthStore()

const formRef = ref()
const loading = ref(false)
const errorMsg = ref('')

const form = reactive({ login_name: '', password: '' })

const rules = {
  login_name: [{ required: true, message: ' ', trigger: 'blur' }],
  password: [{ required: true, message: ' ', trigger: 'blur' }],
}

async function handleLogin() {
  await formRef.value?.validate(async (valid: boolean) => {
    if (!valid) return
    loading.value = true
    errorMsg.value = ''
    try {
      await auth.login(form)
      router.push('/models')
    } catch {
      errorMsg.value = t('login.error')
    } finally {
      loading.value = false
    }
  })
}
</script>
