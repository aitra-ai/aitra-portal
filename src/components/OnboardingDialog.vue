<template>
  <el-dialog
    v-model="visible"
    :title="t('onboarding.title')"
    width="480px"
    :close-on-click-modal="false"
    :show-close="true"
    @close="dismiss"
  >
    <el-steps :active="step" finish-status="success" class="mb-6" simple>
      <el-step :title="t('onboarding.step1.short')" />
      <el-step :title="t('onboarding.step2.short')" />
      <el-step :title="t('onboarding.step3.short')" />
    </el-steps>

    <!-- Step 1: Create API Key -->
    <div v-if="step === 0" class="text-center py-4">
      <p class="text-gray-600 mb-4">{{ t('onboarding.step1.desc') }}</p>
      <div v-if="apiKey" class="bg-gray-50 rounded-lg p-4 mb-4">
        <p class="text-xs text-gray-500 mb-1">{{ t('onboarding.step1.keyCreated') }}</p>
        <code class="text-sm font-mono text-green-600 break-all">{{ apiKey }}</code>
      </div>
      <el-button v-else type="primary" :loading="creating" @click="createKey">{{ t('onboarding.step1.createBtn') }}</el-button>
    </div>

    <!-- Step 2: Try Playground -->
    <div v-if="step === 1" class="text-center py-4">
      <p class="text-gray-600 mb-4">{{ t('onboarding.step2.desc') }}</p>
      <div class="bg-blue-50 rounded-lg p-4 text-sm text-blue-700">
        {{ t('onboarding.step2.hint') }}
      </div>
    </div>

    <!-- Step 3: Check Docs -->
    <div v-if="step === 2" class="text-center py-4">
      <p class="text-gray-600 mb-4">{{ t('onboarding.step3.desc') }}</p>
      <el-button text type="primary" @click="openDocs">{{ t('onboarding.step3.viewDocs') }} →</el-button>
    </div>

    <template #footer>
      <div class="flex justify-between w-full">
        <el-button text @click="dismiss">{{ t('onboarding.skip') }}</el-button>
        <el-button type="primary" @click="next">
          {{ step === 2 ? t('onboarding.done') : t('onboarding.next') }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { createToken } from '../api/tokens'
import { useAuthStore } from '../stores/auth'

const { t } = useI18n()
const router = useRouter()
const auth = useAuthStore()

const visible = ref(false)
const step = ref(0)
const apiKey = ref('')
const creating = ref(false)

const storageKey = `onboarding_done_${auth.username}`

function show() {
  if (localStorage.getItem(storageKey)) return
  visible.value = true
}

function dismiss() {
  localStorage.setItem(storageKey, '1')
  visible.value = false
}

async function createKey() {
  creating.value = true
  try {
    const res = await createToken('aigateway', 'my-first-key')
    apiKey.value = res.data?.data?.token ?? ''
    step.value = 1
  } catch {
    step.value = 1
  } finally {
    creating.value = false
  }
}

function next() {
  if (step.value < 2) {
    step.value++
  } else {
    dismiss()
    router.push('/app/playground')
  }
}

function openDocs() {
  window.open('/docs', '_blank')
}

defineExpose({ show })
</script>
