<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4">
    <!-- Background blobs -->
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

      <h2 class="text-2xl font-bold text-gray-900 mb-1">{{ t('register.title') }}</h2>
      <p class="text-sm text-gray-500 mb-6">{{ t('register.subtitle') }}</p>

      <!-- Success state -->
      <div v-if="success" class="text-center py-6">
        <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <el-icon class="text-green-500 text-3xl"><CircleCheck /></el-icon>
        </div>
        <h3 class="font-semibold text-gray-900 mb-2">{{ t('register.successTitle') }}</h3>
        <p class="text-sm text-gray-500 mb-6">{{ t('register.successDesc') }}</p>
        <el-button type="primary" @click="router.push('/login')">{{ t('register.goLogin') }}</el-button>
      </div>

      <el-form v-else :model="form" :rules="rules" ref="formRef" label-position="top">
        <!-- Email -->
        <el-form-item prop="email">
          <template #label>
            <span class="text-sm font-medium text-gray-700">{{ t('register.email') }}</span>
          </template>
          <div class="flex gap-2">
            <el-input
              v-model="form.email"
              :placeholder="t('register.emailPlaceholder')"
              size="large"
              class="flex-1"
            />
            <el-button
              size="large"
              :loading="sendingCode"
              :disabled="!!codeCooldown || !form.email"
              @click="handleSendCode"
              class="shrink-0 !px-3"
            >
              {{ codeCooldown ? `${codeCooldown}s` : t('register.sendCode') }}
            </el-button>
          </div>
        </el-form-item>

        <!-- Email code -->
        <el-form-item prop="emailCode">
          <template #label>
            <span class="text-sm font-medium text-gray-700">{{ t('register.emailCode') }}</span>
          </template>
          <el-input
            v-model="form.emailCode"
            :placeholder="t('register.emailCodePlaceholder')"
            size="large"
            maxlength="6"
          />
        </el-form-item>

        <!-- Username -->
        <el-form-item prop="username">
          <template #label>
            <span class="text-sm font-medium text-gray-700">{{ t('register.username') }}</span>
          </template>
          <el-input
            v-model="form.username"
            :placeholder="t('register.usernamePlaceholder')"
            size="large"
          />
        </el-form-item>

        <!-- Password -->
        <el-form-item prop="password">
          <template #label>
            <span class="text-sm font-medium text-gray-700">{{ t('register.password') }}</span>
          </template>
          <el-input
            v-model="form.password"
            type="password"
            :placeholder="t('register.passwordPlaceholder')"
            size="large"
            show-password
          />
        </el-form-item>

        <!-- Confirm password -->
        <el-form-item prop="confirmPassword">
          <template #label>
            <span class="text-sm font-medium text-gray-700">{{ t('register.confirmPassword') }}</span>
          </template>
          <el-input
            v-model="form.confirmPassword"
            type="password"
            :placeholder="t('register.confirmPasswordPlaceholder')"
            size="large"
            show-password
            @keyup.enter="handleRegister"
          />
        </el-form-item>

        <el-alert v-if="errorMsg" :title="errorMsg" type="error" class="mb-4" :closable="false" show-icon />

        <el-button
          type="primary"
          size="large"
          class="w-full !h-11 !text-base font-semibold"
          :loading="registering"
          @click="handleRegister"
        >
          {{ t('register.submit') }}
        </el-button>
      </el-form>

      <div v-if="!success" class="text-center text-sm text-gray-500 mt-5">
        {{ t('register.hasAccount') }}
        <router-link to="/login" class="text-blue-500 hover:text-blue-600 font-medium ml-1">
          {{ t('login.submit') }}
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { sendEmailCode, signupWithEmail } from '../api/casdoor'

const { t } = useI18n()
const router = useRouter()

const formRef = ref()
const sendingCode = ref(false)
const registering = ref(false)
const codeCooldown = ref(0)
const success = ref(false)
const errorMsg = ref('')

const form = reactive({
  email: '',
  emailCode: '',
  username: '',
  password: '',
  confirmPassword: '',
})

const rules = {
  email: [
    { required: true, message: ' ', trigger: 'blur' },
    { type: 'email', message: t('register.emailInvalid'), trigger: 'blur' },
  ],
  emailCode: [{ required: true, message: ' ', trigger: 'blur' }],
  username: [
    { required: true, message: ' ', trigger: 'blur' },
    { min: 3, message: t('register.usernameMin'), trigger: 'blur' },
  ],
  password: [
    { required: true, message: ' ', trigger: 'blur' },
    { min: 6, message: t('register.passwordMin'), trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: ' ', trigger: 'blur' },
    {
      validator: (_: any, value: string, cb: Function) => {
        if (value !== form.password) cb(new Error(t('register.passwordMismatch')))
        else cb()
      },
      trigger: 'blur',
    },
  ],
}

function startCooldown() {
  codeCooldown.value = 60
  const timer = setInterval(() => {
    codeCooldown.value--
    if (codeCooldown.value <= 0) clearInterval(timer)
  }, 1000)
}

async function handleSendCode() {
  if (!form.email) return
  sendingCode.value = true
  try {
    const res = await sendEmailCode(form.email)
    if (res.status === 'ok' || res.status === 'affected') {
      ElMessage.success(t('register.codeSent'))
      startCooldown()
    } else {
      ElMessage.error(res.msg || t('common.error'))
    }
  } catch {
    ElMessage.error(t('common.error'))
  } finally {
    sendingCode.value = false
  }
}

async function handleRegister() {
  await formRef.value?.validate(async (valid: boolean) => {
    if (!valid) return
    registering.value = true
    errorMsg.value = ''
    try {
      const res = await signupWithEmail({
        username: form.username,
        email: form.email,
        password: form.password,
        emailCode: form.emailCode,
      })
      if (res.status === 'ok' || res.status === 'affected') {
        success.value = true
      } else {
        errorMsg.value = res.msg || t('common.error')
      }
    } catch {
      errorMsg.value = t('common.error')
    } finally {
      registering.value = false
    }
  })
}
</script>
