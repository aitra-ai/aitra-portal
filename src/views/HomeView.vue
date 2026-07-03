<template>
  <div class="min-h-screen bg-gray-50">
    <TopNav />

    <!-- Hero — "One API, All Models" -->
    <section class="bg-gradient-to-b from-gray-900 to-gray-800 py-20 px-6">
      <div class="max-w-4xl mx-auto text-center">
        <div class="inline-flex items-center gap-2 bg-blue-500/20 text-blue-300 text-xs font-semibold px-3 py-1 rounded-full mb-6 border border-blue-400/30">
          <span class="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          {{ t('home.hero.badge') }}
        </div>
        <h1 class="text-4xl sm:text-5xl font-extrabold text-white mb-4 leading-tight">
          {{ t('home.heroTitle') }}
        </h1>
        <p class="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
          {{ t('home.heroSubtitle') }}
        </p>

        <!-- CTA -->
        <div class="flex items-center justify-center gap-3 flex-wrap mb-12">
          <template v-if="auth.isLoggedIn">
            <el-button size="large" type="primary" @click="router.push('/app/playground')" class="!px-8 !h-11">
              🚀 {{ t('home.cta.goWorkspace') }}
            </el-button>
            <el-button size="large" @click="router.push('/app/model-dashboard')" class="!px-8 !h-11 !bg-white/10 !text-white !border-white/20 hover:!bg-white/20">
              {{ t('home.ctaBrowse') }}
            </el-button>
          </template>
          <template v-else>
            <el-button size="large" type="primary" @click="router.push('/register')" class="!px-8 !h-11">
              {{ t('home.cta.btn') }}
            </el-button>
            <el-button size="large" @click="router.push('/docs')" class="!px-8 !h-11 !bg-white/10 !text-white !border-white/20 hover:!bg-white/20">
              {{ t('nav.docs') }}
            </el-button>
          </template>
        </div>

        <!-- Code Example -->
        <div class="max-w-lg mx-auto text-left">
          <div class="text-xs text-gray-500 mb-2 font-medium">{{ t('home.codeExample.subtitle') }}</div>
          <pre class="bg-black/50 backdrop-blur rounded-xl p-5 text-sm leading-relaxed overflow-x-auto border border-gray-700"><code><span class="text-gray-500">from</span> <span class="text-blue-400">openai</span> <span class="text-gray-500">import</span> <span class="text-blue-400">OpenAI</span>

<span class="text-gray-400">client</span> <span class="text-gray-500">=</span> <span class="text-blue-400">OpenAI</span>(<span class="text-orange-400">base_url</span>=<span class="text-green-400">"{{ baseUrl }}/v1"</span>, <span class="text-orange-400">api_key</span>=<span class="text-green-400">"YOUR_KEY"</span>)
<span class="text-gray-400">r</span> <span class="text-gray-500">=</span> <span class="text-gray-400">client</span>.<span class="text-blue-400">chat</span>.<span class="text-blue-400">completions</span>.<span class="text-blue-400">create</span>(<span class="text-orange-400">model</span>=<span class="text-green-400">"claude-sonnet-4-6"</span>, <span class="text-orange-400">messages</span>=[...])
</code></pre>
        </div>
      </div>
    </section>

    <!-- Provider logos -->
    <section class="bg-white border-b border-gray-100 py-8 px-6">
      <div class="max-w-4xl mx-auto">
        <p class="text-xs text-gray-400 text-center mb-5 uppercase tracking-wider font-medium">
          {{ t('home.providers.title') }}
        </p>
        <div class="flex items-center justify-center gap-8 flex-wrap">
          <span v-for="p in providerLogos" :key="p.name"
            class="text-sm font-semibold px-4 py-2 rounded-lg"
            :style="{ backgroundColor: p.bg, color: p.color }">
            {{ p.name }}
          </span>
        </div>
      </div>
    </section>

    <!-- Stats -->
    <section class="bg-white border-b border-gray-100 py-6 px-6">
      <div class="max-w-4xl mx-auto">
        <div class="grid grid-cols-3 gap-6 text-center">
          <div>
            <div class="text-2xl font-bold text-blue-600">{{ stats.aiModels }}</div>
            <div class="text-sm text-gray-500 mt-1">{{ t('home.stat.aiModels') }}</div>
          </div>
          <div>
            <div class="text-2xl font-bold text-blue-600">{{ stats.modelRepos }}</div>
            <div class="text-sm text-gray-500 mt-1">{{ t('home.stat.modelRepos') }}</div>
          </div>
          <div>
            <div class="text-2xl font-bold text-blue-600">{{ stats.datasets }}</div>
            <div class="text-sm text-gray-500 mt-1">{{ t('home.stat.datasets') }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Selling points -->
    <section class="py-16 px-6 bg-gray-50">
      <div class="max-w-5xl mx-auto">
        <div class="text-center mb-12">
          <h2 class="text-2xl font-bold text-gray-900 mb-2">{{ t('home.selling.title') }}</h2>
          <p class="text-gray-500">{{ t('home.selling.subtitle') }}</p>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div v-for="point in sellingPoints" :key="point.key"
            class="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div class="w-10 h-10 rounded-lg flex items-center justify-center mb-4" :class="point.iconBg">
              <span class="text-xl">{{ point.icon }}</span>
            </div>
            <h3 class="font-semibold text-gray-900 mb-2">{{ t(`home.selling.${point.key}.title`) }}</h3>
            <p class="text-sm text-gray-500 leading-relaxed">{{ t(`home.selling.${point.key}.desc`) }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Hub entry cards (lower weight) -->
    <section class="py-10 px-6 bg-white border-t border-gray-100">
      <div class="max-w-5xl mx-auto">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
          <router-link
            to="/models"
            class="bg-gray-50 rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-sm transition-all group"
          >
            <div class="flex items-center gap-3 mb-2">
              <span class="text-xl">🧠</span>
              <h3 class="font-semibold text-gray-900">{{ t('home.hub.modelsTitle') }}</h3>
            </div>
            <p class="text-sm text-gray-500">{{ t('home.hub.modelsDesc') }}</p>
          </router-link>

          <router-link
            to="/datasets"
            class="bg-gray-50 rounded-xl border border-gray-200 p-5 hover:border-green-300 hover:shadow-sm transition-all group"
          >
            <div class="flex items-center gap-3 mb-2">
              <span class="text-xl">📦</span>
              <h3 class="font-semibold text-gray-900">{{ t('home.hub.datasetsTitle') }}</h3>
            </div>
            <p class="text-sm text-gray-500">{{ t('home.hub.datasetsDesc') }}</p>
          </router-link>

          <router-link
            to="/spaces"
            class="bg-gray-50 rounded-xl border border-gray-200 p-5 hover:border-purple-300 hover:shadow-sm transition-all group"
          >
            <div class="flex items-center gap-3 mb-2">
              <span class="text-xl">🚀</span>
              <h3 class="font-semibold text-gray-900">{{ t('home.hub.spacesTitle') }}</h3>
            </div>
            <p class="text-sm text-gray-500">{{ t('home.hub.spacesDesc') }}</p>
          </router-link>

          <router-link
            to="/mcp"
            class="bg-gray-50 rounded-xl border border-gray-200 p-5 hover:border-orange-300 hover:shadow-sm transition-all group"
          >
            <div class="flex items-center gap-3 mb-2">
              <span class="text-xl">🔌</span>
              <h3 class="font-semibold text-gray-900">{{ t('home.hub.mcpTitle') }}</h3>
            </div>
            <p class="text-sm text-gray-500">{{ t('home.hub.mcpDesc') }}</p>
          </router-link>
        </div>

        <!-- Featured AI Models -->
        <div class="flex items-center justify-between mb-5">
          <h2 class="text-xl font-bold text-gray-900">{{ t('home.featuredAiModels') }}</h2>
          <router-link
            to="/app/model-dashboard"
            class="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            {{ t('home.viewAll') }}
            <el-icon class="text-xs"><ArrowRight /></el-icon>
          </router-link>
        </div>

        <div v-if="aiModelsLoading" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          <div v-for="i in 6" :key="i" class="bg-white rounded-xl border border-gray-100 p-4 h-32 animate-pulse">
            <div class="h-4 bg-gray-100 rounded w-2/3 mb-3" />
            <div class="h-3 bg-gray-100 rounded w-full mb-2" />
            <div class="h-3 bg-gray-100 rounded w-4/5" />
          </div>
        </div>

        <div v-else-if="featuredModels.length === 0" class="text-sm text-gray-400 py-8 text-center bg-white rounded-xl border border-gray-100">
          {{ t('modelHub.empty') }}
        </div>

        <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          <AiModelCard
            v-for="m in featuredModels"
            :key="m.id"
            :model="m"
            @try="handleTryModel"
          />
        </div>
      </div>
    </section>

    <!-- Bottom CTA -->
    <section class="py-12 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-center" v-if="!auth.isLoggedIn">
      <h2 class="text-2xl font-bold text-white mb-2">{{ t('home.cta.title') }}</h2>
      <p class="text-blue-100 mb-6">{{ t('home.cta.desc') }}</p>
      <el-button size="large" @click="router.push('/register')" class="!px-8 !h-11 !bg-white !text-blue-600 !border-0 hover:!bg-blue-50">
        {{ t('home.cta.btn') }}
      </el-button>
    </section>

    <!-- Footer -->
    <footer class="py-8 border-t border-gray-100 text-center text-xs text-gray-400 mt-4">
      © {{ new Date().getFullYear() }} aitra · AI Gateway Platform
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowRight } from '@element-plus/icons-vue'
import TopNav from '../components/TopNav.vue'
import AiModelCard from '../components/AiModelCard.vue'
import { useAuthStore } from '../stores/auth'
import api from '../api/index'

const { t } = useI18n()
const router = useRouter()
const auth = useAuthStore()

const baseUrl = `${window.location.protocol}//${window.location.host}`

interface AIModel {
  id: number
  model_name: string
  api_endpoint: string
  provider: string
  enabled: boolean
}

const aiModels = ref<AIModel[]>([])
const aiModelsLoading = ref(false)
const modelRepoCount = ref(0)
const datasetCount = ref(0)

const featuredModels = computed(() => aiModels.value.slice(0, 6))

const stats = computed(() => ({
  aiModels:   aiModels.value.length  || '—',
  modelRepos: modelRepoCount.value   || '—',
  datasets:   datasetCount.value     || '—',
}))

const providerLogos = [
  { name: 'Anthropic', bg: '#f5f0e8', color: '#d97706' },
  { name: 'OpenAI', bg: '#ecfdf5', color: '#10b981' },
  { name: 'DeepSeek', bg: '#f0f9ff', color: '#0ea5e9' },
  { name: 'Google', bg: '#eff6ff', color: '#3b82f6' },
  { name: 'OpenRouter', bg: '#f5f3ff', color: '#6366f1' },
]

const sellingPoints = [
  { key: 'unifiedApi', icon: '🔗', iconBg: 'bg-blue-50' },
  { key: 'usageTracking', icon: '📊', iconBg: 'bg-green-50' },
  { key: 'zeroCost', icon: '⚡', iconBg: 'bg-orange-50' },
  { key: 'billing', icon: '💳', iconBg: 'bg-purple-50' },
]

function handleTryModel() {
  router.push(auth.isLoggedIn ? '/app/playground' : '/login')
}

async function fetchAiModels() {
  aiModelsLoading.value = true
  try {
    const res = await api.get<{ data: AIModel[] }>('/public/llm_configs')
    aiModels.value = (res.data?.data ?? []).filter(m => m.enabled)
  } catch {
    aiModels.value = []
  } finally {
    aiModelsLoading.value = false
  }
}

async function fetchCounts() {
  try {
    const [mRes, dRes] = await Promise.allSettled([
      api.get('/models?per=1&page=1'),
      api.get('/datasets?per=1&page=1'),
    ])
    if (mRes.status === 'fulfilled') modelRepoCount.value = (mRes.value.data as any)?.total ?? 0
    if (dRes.status === 'fulfilled') datasetCount.value = (dRes.value.data as any)?.total ?? 0
  } catch { /* non-critical */ }
}

onMounted(() => {
  fetchAiModels()
  fetchCounts()
})
</script>
