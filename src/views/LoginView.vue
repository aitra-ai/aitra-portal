<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center">
    <div class="bg-white rounded-2xl shadow-2xl p-10 w-full max-w-md">
      <!-- Logo -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center gap-2 mb-3">
          <div class="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <span class="text-white font-bold text-lg">C</span>
          </div>
          <span class="text-2xl font-bold text-gray-900">CSG Portal</span>
        </div>
        <p class="text-gray-500 text-sm">{{ t('login.title') }}</p>
      </div>

      <el-form :model="form" :rules="rules" ref="formRef" @submit.prevent="handleLogin">
        <el-form-item prop="login_name">
          <el-input
            v-model="form.login_name"
            :placeholder="t('login.username')"
            size="large"
            prefix-icon="User"
          />
        </el-form-item>
        <el-form-item prop="password">
          <el-input
            v-model="form.password"
            type="password"
            :placeholder="t('login.password')"
            size="large"
            prefix-icon="Lock"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <el-alert v-if="errorMsg" :title="errorMsg" type="error" class="mb-4" :closable="false" />

        <el-button
          type="primary"
          size="large"
          class="w-full"
          :loading="loading"
          @click="handleLogin"
        >
          {{ t('login.submit') }}
        </el-button>

        <div class="text-center mt-4 text-sm text-gray-500">
          {{ t('login.noAccount') }}
          <a
            :href="registerUrl"
            target="_blank"
            class="text-blue-500 hover:text-blue-600 font-medium ml-1"
          >
            {{ t('login.register') }}
          </a>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '../stores/auth'

const CASDOOR_URL = import.meta.env.VITE_CASDOOR_URL || 'http://10.100.18.37:8000'
const registerUrl = `${CASDOOR_URL}/signup`

const { t } = useI18n()
const router = useRouter()
const auth = useAuthStore()

const formRef = ref()
const loading = ref(false)
const errorMsg = ref('')

const form = reactive({
  login_name: '',
  password: '',
})

const rules = {
  login_name: [{ required: true, message: t('login.username'), trigger: 'blur' }],
  password: [{ required: true, message: t('login.password'), trigger: 'blur' }],
}

async function handleLogin() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid: boolean) => {
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
