<template>
  <div class="p-6 max-w-5xl mx-auto">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">{{ t('openclaw.title') }}</h1>
      <p class="text-gray-500 mt-1">{{ t('openclaw.subtitle') }}</p>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <!-- Instance list -->
      <div class="xl:col-span-2">
        <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div class="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 class="font-semibold text-gray-800">{{ t('openclaw.instances') }}</h2>
            <el-button size="small" text @click="fetchInstances" :icon="Refresh">
              {{ t('common.retry') }}
            </el-button>
          </div>

          <div v-if="loading" class="flex items-center justify-center py-16">
            <el-icon class="animate-spin text-blue-500 text-2xl"><Loading /></el-icon>
          </div>

          <div v-else-if="instances.length === 0" class="flex flex-col items-center justify-center py-16 text-gray-400">
            <el-icon class="text-5xl mb-3 text-gray-200"><Grid /></el-icon>
            <p>{{ t('openclaw.noInstances') }}</p>
          </div>

          <div v-else class="divide-y divide-gray-100">
            <div
              v-for="inst in instances"
              :key="inst.id"
              class="px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors"
            >
              <div class="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center shrink-0">
                <el-icon class="text-purple-500 text-xl"><Grid /></el-icon>
              </div>
              <div class="flex-1 min-w-0">
                <div class="font-medium text-gray-900 truncate">{{ inst.name }}</div>
                <div class="text-xs text-gray-400 mt-0.5 truncate">{{ inst.namespace }}</div>
                <div v-if="inst.endpoint" class="text-xs text-blue-400 mt-0.5 font-mono truncate">
                  {{ inst.endpoint }}
                </div>
              </div>
              <el-tag :type="statusType(inst.status)" size="small">
                {{ inst.status || 'active' }}
              </el-tag>
            </div>
          </div>
        </div>
      </div>

      <!-- Setup guide -->
      <div class="space-y-4">
        <div class="bg-white rounded-xl border border-gray-200 p-5">
          <h2 class="font-semibold text-gray-800 mb-4">{{ t('openclaw.configure') }}</h2>
          <ol class="space-y-3">
            <li class="flex gap-3">
              <div class="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold shrink-0">1</div>
              <p class="text-sm text-gray-600">{{ t('openclaw.step1') }}</p>
            </li>
            <li class="flex gap-3">
              <div class="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold shrink-0">2</div>
              <p class="text-sm text-gray-600">{{ t('openclaw.step2') }}</p>
            </li>
            <li class="flex gap-3">
              <div class="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold shrink-0">3</div>
              <p class="text-sm text-gray-600">{{ t('openclaw.step3') }}</p>
            </li>
          </ol>
        </div>

        <!-- Config example -->
        <div class="bg-white rounded-xl border border-gray-200 p-5">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-semibold text-gray-800 text-sm">{{ t('openclaw.configTitle') }}</h3>
            <el-button size="small" text @click="copyConfig">
              <el-icon><CopyDocument /></el-icon>
              {{ t('common.copy') }}
            </el-button>
          </div>
          <pre class="bg-gray-900 text-green-400 rounded-lg p-3 text-xs overflow-x-auto leading-relaxed">{{ configExample }}</pre>
        </div>

        <!-- Model list for reference -->
        <div class="bg-white rounded-xl border border-gray-200 p-5">
          <h3 class="font-semibold text-gray-800 text-sm mb-3">可用模型</h3>
          <div v-if="modelsLoading" class="text-center py-4">
            <el-icon class="animate-spin text-blue-400"><Loading /></el-icon>
          </div>
          <div v-else class="space-y-2">
            <div
              v-for="m in models.slice(0, 6)"
              :key="m.id"
              class="flex items-center gap-2 text-sm"
            >
              <div class="w-1.5 h-1.5 bg-green-400 rounded-full shrink-0" />
              <span class="text-gray-700 truncate font-mono text-xs">{{ m.id }}</span>
            </div>
            <div v-if="models.length > 6" class="text-xs text-gray-400">
              +{{ models.length - 6 }} more
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { listMcpServers } from '../api/mcp'
import { listModels } from '../api/models'
import type { McpServer } from '../api/mcp'
import type { Model } from '../api/models'

const { t } = useI18n()

const instances = ref<McpServer[]>([])
const models = ref<Model[]>([])
const loading = ref(false)
const modelsLoading = ref(false)

const API_BASE = `${window.location.protocol}//${window.location.host}/api/v1`

const configExample = computed(() => `# ~/.openclaw/config.yaml
model:
  provider: openai_compatible
  base_url: "${API_BASE}"
  api_key: "YOUR_CSG_API_KEY"
  model: "your-model-id"`)

onMounted(() => {
  fetchInstances()
  fetchModels()
})

async function fetchInstances() {
  loading.value = true
  try {
    const res = await listMcpServers()
    instances.value = res.data?.data ?? []
  } catch {
    instances.value = []
  } finally {
    loading.value = false
  }
}

async function fetchModels() {
  modelsLoading.value = true
  try {
    const res = await listModels()
    models.value = res.data?.data ?? []
  } catch {
    models.value = []
  } finally {
    modelsLoading.value = false
  }
}

function statusType(status?: string) {
  const map: Record<string, string> = {
    running: 'success',
    active: 'success',
    stopped: 'info',
    error: 'danger',
  }
  return (map[status?.toLowerCase() ?? ''] ?? 'info') as any
}

function copyConfig() {
  navigator.clipboard.writeText(configExample.value).then(() => {
    ElMessage.success(t('apikeys.copySuccess'))
  })
}
</script>
