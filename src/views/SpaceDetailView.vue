<template>
  <div class="min-h-screen bg-gray-50">
    <TopNav />

    <div class="max-w-6xl mx-auto px-6 py-8">
      <!-- Header -->
      <div class="flex items-start gap-6 mb-8">
        <div v-if="space?.cover_url" class="w-24 h-24 rounded-2xl overflow-hidden shadow-md flex-shrink-0">
          <img :src="space.cover_url" class="w-full h-full object-cover" :alt="space?.display_name" />
        </div>
        <div v-else class="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-md">
          <span class="text-4xl">🚀</span>
        </div>
        <div class="flex-1">
          <div class="flex items-center gap-3 mb-2">
            <h1 class="text-2xl font-bold text-gray-900">{{ space?.display_name || spacePath }}</h1>
            <el-tag size="small" type="info">{{ space?.template }}</el-tag>
          </div>
          <p class="text-gray-500 text-sm mb-3">{{ space?.description }}</p>
          <div class="flex items-center gap-4 text-sm text-gray-400">
            <span>📦 {{ spacePath }}</span>
            <span>⏱ TTL: {{ formatTTL(space?.ttl_seconds) }}</span>
            <span v-if="space?.running_instances !== undefined">
              🟢 {{ space.running_instances }} 实例运行中
            </span>
          </div>
        </div>

        <!-- Action buttons -->
        <div class="flex flex-col items-end gap-2">
          <el-button
            v-if="instanceStatus === 'idle' || instanceStatus === 'stopped' || instanceStatus === 'error'"
            type="primary"
            size="large"
            :loading="instanceStatus === 'launching'"
            @click="launch"
          >
            🚀 {{ t('sandbox.launch') }}
          </el-button>
          <el-button
            v-if="instanceStatus === 'running'"
            type="danger"
            size="default"
            @click="stop"
          >
            ⏹ {{ t('sandbox.stop') }}
          </el-button>
          <!-- 倒计时 -->
          <div v-if="instanceStatus === 'running' && timeLeft > 0" class="text-xs text-gray-400 text-right">
            <div class="font-mono text-sm text-orange-500">{{ formatCountdown(timeLeft) }}</div>
            <div>{{ t('sandbox.expiresIn') }}</div>
          </div>
        </div>
      </div>

      <!-- Status bar -->
      <div class="mb-4">
        <div v-if="instanceStatus === 'launching'" class="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
          <el-icon class="animate-spin text-blue-500 text-xl"><Loading /></el-icon>
          <div>
            <div class="font-medium text-blue-700">{{ t('sandbox.starting') }}</div>
            <div class="text-sm text-blue-500">{{ t('sandbox.startingDesc') }}</div>
          </div>
        </div>
        <div v-else-if="instanceStatus === 'error'" class="flex items-center gap-3 p-4 bg-red-50 rounded-xl border border-red-100">
          <span class="text-2xl">❌</span>
          <div>
            <div class="font-medium text-red-700">{{ t('sandbox.errorTitle') }}</div>
            <div class="text-sm text-red-500">{{ errorMsg || t('sandbox.errorDesc') }}</div>
          </div>
        </div>
      </div>

      <!-- Sandbox iframe -->
      <div
        v-if="instanceStatus === 'running' && accessURL"
        class="rounded-2xl overflow-hidden shadow-lg border border-gray-200 bg-white"
      >
        <!-- Toolbar -->
        <div class="flex items-center gap-3 px-4 py-2 bg-gray-100 border-b border-gray-200">
          <div class="flex gap-1.5">
            <div class="w-3 h-3 rounded-full bg-red-400"></div>
            <div class="w-3 h-3 rounded-full bg-yellow-400"></div>
            <div class="w-3 h-3 rounded-full bg-green-400"></div>
          </div>
          <div class="flex-1 bg-white rounded-md px-3 py-1 text-sm text-gray-400 font-mono">
            {{ accessURL }}
          </div>
          <a :href="accessURL" target="_blank" class="text-gray-400 hover:text-blue-500 transition-colors">
            <el-icon><TopRight /></el-icon>
          </a>
        </div>
        <iframe
          :src="accessURL"
          class="w-full"
          :style="{ height: iframeHeight }"
          allow="microphone; camera; clipboard-read; clipboard-write"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
        />
      </div>

      <!-- Idle state -->
      <div v-if="instanceStatus === 'idle'" class="flex flex-col items-center justify-center py-24 text-gray-400">
        <div class="text-6xl mb-4">🧊</div>
        <div class="text-lg font-medium text-gray-500 mb-2">{{ t('sandbox.idleTitle') }}</div>
        <div class="text-sm">{{ t('sandbox.idleDesc') }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { Loading, TopRight } from '@element-plus/icons-vue'
import TopNav from '../components/TopNav.vue'
import {
  listFeaturedSpaces,
  launchSandbox,
  getSandboxStatus,
  stopSandbox,
  type FeaturedSpace,
  type SandboxInstance,
} from '../api/sandbox'

const { t } = useI18n()
const route = useRoute()

const namespace = route.params.namespace as string
const name = route.params.name as string
const spacePath = `${namespace}/${name}`

const space = ref<FeaturedSpace | null>(null)
const instanceStatus = ref<'idle' | 'launching' | 'running' | 'stopped' | 'error'>('idle')
const currentInstance = ref<SandboxInstance | null>(null)
const accessURL = ref('')
const errorMsg = ref('')
const timeLeft = ref(0)
const iframeHeight = ref('70vh')

let pollInterval: ReturnType<typeof setInterval> | null = null
let countdownInterval: ReturnType<typeof setInterval> | null = null

onMounted(async () => {
  // 加载 featured space 信息
  try {
    const res = await listFeaturedSpaces()
    const spaces = (res.data as any)?.data ?? res.data
    space.value = spaces.find((s: FeaturedSpace) => s.space_path === spacePath) ?? null
  } catch {
    // 空间可能不是 featured，继续
  }
})

onUnmounted(() => {
  clearPolling()
  clearCountdown()
})

async function launch() {
  instanceStatus.value = 'launching'
  errorMsg.value = ''
  try {
    const res = await launchSandbox(namespace, name)
    const data = (res.data as any)?.data ?? res.data

    // 如果直接 running（来自热池）
    if (data.status === 'running' && data.access_url) {
      setRunning(data as SandboxInstance)
      return
    }

    // 否则轮询状态
    const instanceId = data.id
    startPolling(instanceId)
  } catch (e: any) {
    instanceStatus.value = 'error'
    errorMsg.value = e?.response?.data?.msg || String(e)
    ElMessage.error(t('sandbox.launchFailed'))
  }
}

function startPolling(id: number) {
  pollInterval = setInterval(async () => {
    try {
      const res = await getSandboxStatus(id)
      const inst = (res.data as any)?.data ?? (res.data as SandboxInstance)
      currentInstance.value = inst

      if (inst.status === 'running' && inst.access_url) {
        clearPolling()
        setRunning(inst)
      } else if (inst.status === 'error') {
        clearPolling()
        instanceStatus.value = 'error'
        errorMsg.value = inst.error_msg || t('sandbox.errorDesc')
      }
    } catch {
      // 继续轮询
    }
  }, 2000)
}

function setRunning(inst: SandboxInstance) {
  currentInstance.value = inst
  accessURL.value = inst.access_url!
  instanceStatus.value = 'running'
  if (inst.expires_at) {
    startCountdown(new Date(inst.expires_at).getTime())
  }
}

function startCountdown(expiresAt: number) {
  countdownInterval = setInterval(() => {
    timeLeft.value = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000))
    if (timeLeft.value === 0) {
      clearCountdown()
      instanceStatus.value = 'stopped'
      ElMessage.warning(t('sandbox.expired'))
    }
  }, 1000)
}

async function stop() {
  if (!currentInstance.value) return
  try {
    await stopSandbox(currentInstance.value.id)
    clearPolling()
    clearCountdown()
    instanceStatus.value = 'stopped'
    accessURL.value = ''
    ElMessage.success(t('sandbox.stopped'))
  } catch {
    ElMessage.error(t('common.error'))
  }
}

function clearPolling() {
  if (pollInterval) { clearInterval(pollInterval); pollInterval = null }
}
function clearCountdown() {
  if (countdownInterval) { clearInterval(countdownInterval); countdownInterval = null }
}

function formatTTL(seconds?: number): string {
  if (!seconds) return '-'
  if (seconds >= 3600) return `${Math.floor(seconds / 3600)}h`
  return `${Math.floor(seconds / 60)}min`
}

function formatCountdown(s: number): string {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${String(sec).padStart(2, '0')}`
}
</script>
