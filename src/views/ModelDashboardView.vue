<template>
  <div class="p-6 max-w-6xl mx-auto">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">{{ t('modelDashboard.title') }}</h1>
      <p class="text-gray-500 mt-1">{{ t('modelDashboard.subtitle') }}</p>
    </div>

    <!-- Search & Filter & Sort Bar -->
    <div class="flex flex-wrap gap-3 mb-6 items-center">
      <el-input
        v-model="searchQuery"
        :placeholder="t('modelDashboard.searchPlaceholder')"
        clearable
        class="!w-64"
        :prefix-icon="Search"
      />
      <el-select
        v-model="selectedProvider"
        :placeholder="t('modelDashboard.allProviders')"
        clearable
        class="!w-44"
      >
        <el-option
          v-for="p in providers"
          :key="p"
          :label="providerLabel(p)"
          :value="p"
        />
      </el-select>
      <el-select
        v-model="selectedStatus"
        :placeholder="t('modelDashboard.allStatus')"
        clearable
        class="!w-36"
      >
        <el-option :label="t('modelDashboard.online')" value="online" />
        <el-option :label="t('modelDashboard.offline')" value="offline" />
      </el-select>
      <el-select
        v-model="sortMode"
        class="!w-40"
      >
        <el-option :label="t('modelDashboard.sortPopular')" value="popular" />
        <el-option :label="t('modelDashboard.sortNewest')" value="newest" />
        <el-option :label="t('modelDashboard.sortName')" value="name" />
      </el-select>
      <div class="flex-1" />
      <span class="text-sm text-gray-400">
        {{ filteredModels.length }} {{ t('modelDashboard.modelsAvailable') }}
      </span>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <el-skeleton v-for="i in 6" :key="i" :rows="4" animated class="p-4 bg-white rounded-xl border border-gray-100" />
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredModels.length === 0" class="flex flex-col items-center justify-center py-20 text-gray-400">
      <el-icon class="text-5xl mb-3 text-gray-200"><Box /></el-icon>
      <p>{{ t('modelDashboard.noModels') }}</p>
    </div>

    <!-- Model Cards grouped by provider -->
    <template v-else>
      <div v-for="group in groupedModels" :key="group.provider" class="mb-8">
        <div class="flex items-center gap-2 mb-3">
          <span
            class="text-xs font-semibold px-2.5 py-1 rounded-full"
            :style="badgeStyle(group.provider)"
          >{{ providerLabel(group.provider) }}</span>
          <span class="text-xs text-gray-400">{{ group.models.length }} {{ group.models.length === 1 ? 'model' : 'models' }}</span>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="model in group.models"
            :key="model.id"
            class="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-md transition-all group"
          >
            <!-- Model Header -->
            <div class="flex items-start justify-between mb-3">
              <div class="flex-1 min-w-0">
                <h3 class="text-sm font-semibold text-gray-900 truncate" :title="model.model_name">
                  {{ model.model_name }}
                </h3>
                <p class="text-xs text-gray-400 mt-0.5 truncate" :title="model.api_endpoint">
                  {{ shortenEndpoint(model.api_endpoint) }}
                </p>
              </div>
              <div class="flex items-center gap-1.5 shrink-0 ml-2">
                <!-- Popularity tag -->
                <span v-if="getCallCount(model.model_name) > 0" class="inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full bg-orange-50 text-orange-600 font-medium">
                  🔥 {{ formatCallCount(getCallCount(model.model_name)) }}
                </span>
                <span v-else class="inline-flex items-center text-xs px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-500 font-medium">
                  {{ t('modelDashboard.new') }}
                </span>
                <span
                  class="w-2 h-2 rounded-full mt-0.5"
                  :class="model.enabled ? 'bg-green-400' : 'bg-gray-300'"
                  :title="model.enabled ? t('modelDashboard.online') : t('modelDashboard.offline')"
                />
              </div>
            </div>

            <!-- Info Row -->
            <div class="flex items-center gap-3 text-xs text-gray-500 mb-2">
              <span class="flex items-center gap-1">
                <el-icon class="text-gray-400"><Connection /></el-icon>
                {{ model.enabled ? t('modelDashboard.online') : t('modelDashboard.offline') }}
              </span>
              <span class="flex items-center gap-1">
                <el-icon class="text-gray-400"><Timer /></el-icon>
                {{ model.last_check_at ? timeAgo(model.last_check_at) : t('modelDashboard.externalApi') }}
              </span>
            </div>

            <!-- Price Row -->
            <div class="flex items-center gap-3 text-xs mb-4">
              <template v-if="model.price_input != null && model.price_output != null">
                <span class="text-emerald-600 font-medium">
                  ${{ model.price_input }}<span class="text-gray-400">/1M in</span>
                </span>
                <span class="text-orange-600 font-medium">
                  ${{ model.price_output }}<span class="text-gray-400">/1M out</span>
                </span>
              </template>
              <span v-else class="text-gray-300 italic">{{ t('billing.priceNotSet') }}</span>
            </div>

            <!-- Actions -->
            <div class="flex gap-2">
              <el-button
                size="small"
                type="primary"
                class="flex-1"
                :disabled="!model.enabled"
                @click="goPlayground(model)"
              >
                {{ t('modelDashboard.tryInPlayground') }}
              </el-button>
              <el-button
                size="small"
                text
                @click="showApiExample(model)"
              >
                {{ t('modelDashboard.apiExample') }}
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- API Example Dialog -->
    <el-dialog v-model="exampleDialogVisible" :title="exampleModel?.model_name" width="560px">
      <div v-if="exampleModel" class="space-y-4">
        <h4 class="text-sm font-semibold text-gray-700">{{ t('modelDashboard.apiCallExample') }}</h4>
        <el-tabs>
          <el-tab-pane label="Python">
            <pre class="bg-gray-900 text-green-400 rounded-lg p-4 text-xs overflow-x-auto leading-relaxed whitespace-pre-wrap">{{ pythonExample(exampleModel) }}</pre>
          </el-tab-pane>
          <el-tab-pane label="cURL">
            <pre class="bg-gray-900 text-green-400 rounded-lg p-4 text-xs overflow-x-auto leading-relaxed whitespace-pre-wrap">{{ curlExample(exampleModel) }}</pre>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { Search, Box, Connection, Timer } from '@element-plus/icons-vue'
import api from '../api/index'

const { t } = useI18n()
const router = useRouter()

interface LLMModel {
  id: number
  model_name: string
  api_endpoint: string
  provider: string
  enabled: boolean
  created_at: string
  updated_at: string
  price_input?: number
  price_output?: number
  last_check_at?: string
  health_status?: string
}

interface ModelStat {
  model_id: string
  total_requests: number
}

const models = ref<LLMModel[]>([])
const modelStats = ref<Map<string, number>>(new Map())
const loading = ref(false)
const searchQuery = ref('')
const selectedProvider = ref('')
const selectedStatus = ref('')
const sortMode = ref('popular')
const exampleDialogVisible = ref(false)
const exampleModel = ref<LLMModel | null>(null)

const AIGATEWAY_BASE = `${window.location.protocol}//${window.location.host}`

const PROVIDER_COLORS: Record<string, { bg: string; text: string }> = {
  anthropic:  { bg: '#d97706', text: '#fff' },
  openai:     { bg: '#10b981', text: '#fff' },
  google:     { bg: '#3b82f6', text: '#fff' },
  mistral:    { bg: '#8b5cf6', text: '#fff' },
  meta:       { bg: '#1d4ed8', text: '#fff' },
  deepseek:   { bg: '#0ea5e9', text: '#fff' },
  openrouter: { bg: '#6366f1', text: '#fff' },
}

function getCallCount(modelName: string): number {
  return modelStats.value.get(modelName) ?? 0
}

function formatCallCount(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
  return String(count)
}

// Computed
const providers = computed(() => {
  const set = new Set(models.value.map(m => m.provider).filter(Boolean))
  return Array.from(set).sort()
})

const filteredModels = computed(() => {
  let result = models.value.filter(m => {
    if (searchQuery.value && !m.model_name.toLowerCase().includes(searchQuery.value.toLowerCase())) return false
    if (selectedProvider.value && m.provider !== selectedProvider.value) return false
    if (selectedStatus.value === 'online' && !m.enabled) return false
    if (selectedStatus.value === 'offline' && m.enabled) return false
    return true
  })

  // Sort
  if (sortMode.value === 'popular') {
    result = [...result].sort((a, b) => getCallCount(b.model_name) - getCallCount(a.model_name))
  } else if (sortMode.value === 'newest') {
    result = [...result].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  } else {
    result = [...result].sort((a, b) => a.model_name.localeCompare(b.model_name))
  }

  return result
})

const groupedModels = computed(() => {
  const groups: Record<string, LLMModel[]> = {}
  for (const m of filteredModels.value) {
    const key = m.provider || 'other'
    if (!groups[key]) groups[key] = []
    groups[key].push(m)
  }
  return Object.entries(groups)
    .map(([provider, models]) => ({ provider, models }))
    .sort((a, b) => {
      if (sortMode.value === 'popular') {
        const totalA = a.models.reduce((sum, m) => sum + getCallCount(m.model_name), 0)
        const totalB = b.models.reduce((sum, m) => sum + getCallCount(m.model_name), 0)
        return totalB - totalA
      }
      return a.provider.localeCompare(b.provider)
    })
})

// Methods
function providerLabel(p: string) {
  if (!p) return 'Other'
  return p.charAt(0).toUpperCase() + p.slice(1)
}

function badgeStyle(provider: string) {
  const key = (provider || '').toLowerCase()
  const c = PROVIDER_COLORS[key] ?? { bg: '#6b7280', text: '#fff' }
  return { backgroundColor: c.bg, color: c.text }
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return t('modelDashboard.justChecked')
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function shortenEndpoint(url: string) {
  try {
    const u = new URL(url)
    return u.hostname
  } catch {
    return url
  }
}

function goPlayground(model: LLMModel) {
  router.push({ name: 'playground', query: { model: model.model_name } })
}

function showApiExample(model: LLMModel) {
  exampleModel.value = model
  exampleDialogVisible.value = true
}

function pythonExample(model: LLMModel) {
  return `from openai import OpenAI

client = OpenAI(
    api_key="YOUR_API_KEY",
    base_url="${AIGATEWAY_BASE}/v1"
)

response = client.chat.completions.create(
    model="${model.model_name}",
    messages=[{"role": "user", "content": "Hello!"}]
)
print(response.choices[0].message.content)`
}

function curlExample(model: LLMModel) {
  return `curl ${AIGATEWAY_BASE}/v1/chat/completions \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${model.model_name}",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`
}

async function fetchModels() {
  loading.value = true
  try {
    const [modelsRes, statsRes] = await Promise.all([
      api.get<{ data: LLMModel[] }>('/public/llm_configs'),
      api.get<{ data: ModelStat[] }>('/public/model_stats').catch(() => ({ data: { data: [] } })),
    ])
    models.value = modelsRes.data?.data ?? []

    const statsMap = new Map<string, number>()
    const statsData = statsRes.data?.data ?? []
    for (const s of statsData) {
      statsMap.set(s.model_id, s.total_requests)
    }
    modelStats.value = statsMap
  } catch {
    models.value = []
  } finally {
    loading.value = false
  }
}

onMounted(fetchModels)
</script>
