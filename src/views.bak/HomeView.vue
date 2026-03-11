<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Navbar -->
    <nav class="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div class="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <div class="flex items-center gap-8">
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <span class="text-white font-bold text-xs">C</span>
            </div>
            <span class="font-bold text-gray-900">aitra</span>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <el-select v-model="currentLang" size="small" style="width: 90px" @change="changeLang">
            <el-option value="zh" label="中文" />
            <el-option value="en" label="English" />
          </el-select>
          <el-button size="small" @click="router.push('/login')">{{ t('nav.login') }}</el-button>
          <el-button size="small" type="primary" @click="router.push('/register')">{{ t('nav.register') }}</el-button>
        </div>
      </div>
    </nav>

    <!-- Tab navigation -->
    <div class="bg-white border-b border-gray-100">
      <div class="max-w-7xl mx-auto px-6">
        <div class="flex gap-0">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            class="px-5 py-3.5 text-sm font-medium border-b-2 transition-colors"
            :class="activeTab === tab.key
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-800'"
            @click="switchTab(tab.key)"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- ===================== MODELS TAB ===================== -->
    <div v-if="activeTab === 'models'">
      <!-- AI 模型 section -->
      <div class="bg-white border-b border-gray-100 py-6 px-6">
        <div class="max-w-7xl mx-auto">
          <h2 class="text-lg font-bold text-gray-900 mb-4">{{ t('home.aiModels') }}</h2>
          <div v-if="aiModelsLoading" class="flex justify-center py-8">
            <el-icon class="animate-spin text-blue-500 text-3xl"><Loading /></el-icon>
          </div>
          <div v-else-if="aiModels.length === 0" class="text-sm text-gray-400 py-4">
            {{ t('modelHub.empty') }}
          </div>
          <div v-else class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            <div
              v-for="m in aiModels"
              :key="m.id"
              class="bg-gray-50 rounded-xl border border-gray-200 p-4 flex flex-col gap-2 hover:border-blue-300 hover:shadow-sm transition-all"
            >
              <div class="flex items-center gap-2">
                <span
                  class="text-xs font-semibold px-2 py-0.5 rounded-full"
                  :style="providerBadgeStyle(m.provider)"
                >{{ m.provider || 'AI' }}</span>
              </div>
              <p class="text-sm font-medium text-gray-800 truncate" :title="m.model_name">{{ m.model_name }}</p>
              <el-button
                size="small"
                type="primary"
                class="mt-auto w-full"
                @click="tryAiModel()"
              >立即体验</el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 模型仓库 section -->
      <div class="bg-white border-b border-gray-100 py-6 px-6">
        <div class="max-w-7xl mx-auto">
          <div class="flex flex-col md:flex-row md:items-end gap-4 mb-4">
            <div class="flex-1">
              <h2 class="text-lg font-bold text-gray-900 mb-1">{{ t('home.nav.modelHub') }}</h2>
              <p class="text-gray-500 text-sm">{{ t('modelHub.subtitle') }}</p>
            </div>
            <div class="flex items-center gap-3 flex-wrap">
              <el-input
                v-model="searchQuery"
                :placeholder="t('modelHub.searchPlaceholder')"
                :prefix-icon="Search"
                clearable
                style="width: 240px"
                @input="onSearch"
              />
              <el-select v-model="sortBy" size="default" style="width: 140px" @change="fetchModels">
                <el-option value="recently_update" :label="t('modelHub.sortRecent')" />
                <el-option value="trending"        :label="t('modelHub.sortTrending')" />
                <el-option value="most_download"   :label="t('modelHub.sortDownload')" />
                <el-option value="most_like"       :label="t('modelHub.sortLike')" />
              </el-select>
              <el-radio-group v-model="viewMode" size="small">
                <el-radio-button value="grid"><el-icon><Grid /></el-icon></el-radio-button>
                <el-radio-button value="list"><el-icon><List /></el-icon></el-radio-button>
              </el-radio-group>
            </div>
          </div>
          <div class="flex items-center gap-6 text-sm text-gray-400 mb-2">
            <span>{{ t('modelHub.total', { count: total }) }}</span>
            <span v-if="searchQuery" class="text-blue-500">
              "{{ searchQuery }}" ·
              <button class="underline" @click="searchQuery = ''; fetchModels()">{{ t('modelHub.clearSearch') }}</button>
            </span>
          </div>
        </div>
      </div>

      <!-- Model list -->
      <div class="max-w-7xl mx-auto px-6 py-6">
        <div v-if="loading" class="flex justify-center py-24">
          <el-icon class="animate-spin text-blue-500 text-4xl"><Loading /></el-icon>
        </div>
        <el-empty v-else-if="models.length === 0" :description="searchQuery ? t('modelHub.noResults') : t('modelHub.empty')" class="py-24">
          <el-button v-if="!searchQuery" type="primary" @click="router.push('/register')">
            {{ t('nav.register') }}
          </el-button>
        </el-empty>
        <div v-else-if="viewMode === 'grid'" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <div
            v-for="model in models"
            :key="model.path"
            class="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group flex flex-col"
            @click="openModel(model)"
          >
            <div class="flex items-start justify-between mb-3">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-base shrink-0">
                {{ avatarChar(model) }}
              </div>
              <el-tag size="small" :type="model.private ? 'warning' : 'success'">
                {{ model.private ? 'Private' : 'Public' }}
              </el-tag>
            </div>
            <h3 class="font-semibold text-gray-900 mb-0.5 truncate text-sm group-hover:text-blue-600 transition-colors">
              {{ model.nickname || model.name }}
            </h3>
            <p class="text-xs text-gray-400 mb-2 truncate">{{ model.path }}</p>
            <p class="text-xs text-gray-500 mb-4 line-clamp-2 leading-relaxed flex-1">
              {{ model.description || t('modelHub.noDescription') }}
            </p>
            <div class="flex items-center justify-between text-xs text-gray-400">
              <div class="flex items-center gap-3">
                <span class="flex items-center gap-1"><el-icon><Star /></el-icon>{{ model.likes ?? 0 }}</span>
                <span class="flex items-center gap-1"><el-icon><Download /></el-icon>{{ model.downloads ?? 0 }}</span>
              </div>
              <span>{{ formatDate(model.updated_at) }}</span>
            </div>
          </div>
        </div>
        <div v-else class="space-y-2">
          <div
            v-for="model in models"
            :key="model.path"
            class="bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-center gap-4 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
            @click="openModel(model)"
          >
            <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {{ avatarChar(model) }}
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-0.5">
                <span class="font-semibold text-gray-900 text-sm">{{ model.nickname || model.name }}</span>
                <el-tag size="small" :type="model.private ? 'warning' : 'success'" class="shrink-0">
                  {{ model.private ? 'Private' : 'Public' }}
                </el-tag>
              </div>
              <p class="text-xs text-gray-400 truncate">{{ model.path }}</p>
            </div>
            <p class="text-xs text-gray-500 truncate max-w-sm hidden lg:block">{{ model.description || '—' }}</p>
            <div class="flex items-center gap-4 text-xs text-gray-400 shrink-0">
              <span class="flex items-center gap-1"><el-icon><Star /></el-icon>{{ model.likes ?? 0 }}</span>
              <span class="flex items-center gap-1"><el-icon><Download /></el-icon>{{ model.downloads ?? 0 }}</span>
              <span>{{ formatDate(model.updated_at) }}</span>
            </div>
          </div>
        </div>
        <div v-if="total > perPage" class="flex justify-center mt-8">
          <el-pagination
            v-model:current-page="page"
            :page-size="perPage"
            :total="total"
            layout="prev, pager, next"
            @current-change="fetchModels"
          />
        </div>
      </div>
    </div>

    <!-- ===================== DATASETS TAB ===================== -->
    <div v-else-if="activeTab === 'datasets'">
      <div class="bg-white border-b border-gray-100 py-6 px-6">
        <div class="max-w-7xl mx-auto">
          <div class="flex flex-col md:flex-row md:items-end gap-4 mb-4">
            <div class="flex-1">
              <h2 class="text-lg font-bold text-gray-900 mb-1">{{ t('home.datasetHub') }}</h2>
            </div>
            <div class="flex items-center gap-3 flex-wrap">
              <el-input
                v-model="dsSearch"
                :placeholder="t('modelHub.searchPlaceholder')"
                :prefix-icon="Search"
                clearable
                style="width: 240px"
                @input="onDsSearch"
              />
              <el-select v-model="dsSortBy" size="default" style="width: 140px" @change="fetchDatasets">
                <el-option value="recently_update" :label="t('modelHub.sortRecent')" />
                <el-option value="trending"        :label="t('modelHub.sortTrending')" />
                <el-option value="most_download"   :label="t('modelHub.sortDownload')" />
                <el-option value="most_like"       :label="t('modelHub.sortLike')" />
              </el-select>
              <el-radio-group v-model="dsViewMode" size="small">
                <el-radio-button value="grid"><el-icon><Grid /></el-icon></el-radio-button>
                <el-radio-button value="list"><el-icon><List /></el-icon></el-radio-button>
              </el-radio-group>
            </div>
          </div>
          <div class="text-sm text-gray-400">{{ t('modelHub.total', { count: dsTotal }) }}</div>
        </div>
      </div>
      <div class="max-w-7xl mx-auto px-6 py-6">
        <div v-if="dsLoading" class="flex justify-center py-24">
          <el-icon class="animate-spin text-blue-500 text-4xl"><Loading /></el-icon>
        </div>
        <el-empty v-else-if="datasets.length === 0" :description="t('modelHub.empty')" class="py-24" />
        <div v-else-if="dsViewMode === 'grid'" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <div
            v-for="ds in datasets"
            :key="ds.path"
            class="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer flex flex-col"
          >
            <div class="flex items-start justify-between mb-3">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center text-white font-bold text-base shrink-0">
                {{ avatarChar(ds) }}
              </div>
              <el-tag size="small" :type="ds.private ? 'warning' : 'success'">
                {{ ds.private ? 'Private' : 'Public' }}
              </el-tag>
            </div>
            <h3 class="font-semibold text-gray-900 mb-0.5 truncate text-sm">{{ ds.nickname || ds.name }}</h3>
            <p class="text-xs text-gray-400 mb-2 truncate">{{ ds.path }}</p>
            <p class="text-xs text-gray-500 mb-4 line-clamp-2 leading-relaxed flex-1">{{ ds.description || t('modelHub.noDescription') }}</p>
            <div class="flex items-center justify-between text-xs text-gray-400">
              <div class="flex items-center gap-3">
                <span class="flex items-center gap-1"><el-icon><Star /></el-icon>{{ ds.likes ?? 0 }}</span>
                <span class="flex items-center gap-1"><el-icon><Download /></el-icon>{{ ds.downloads ?? 0 }}</span>
              </div>
              <span>{{ formatDate(ds.updated_at) }}</span>
            </div>
          </div>
        </div>
        <div v-else class="space-y-2">
          <div
            v-for="ds in datasets"
            :key="ds.path"
            class="bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-center gap-4 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
          >
            <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {{ avatarChar(ds) }}
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-0.5">
                <span class="font-semibold text-gray-900 text-sm">{{ ds.nickname || ds.name }}</span>
                <el-tag size="small" :type="ds.private ? 'warning' : 'success'" class="shrink-0">{{ ds.private ? 'Private' : 'Public' }}</el-tag>
              </div>
              <p class="text-xs text-gray-400 truncate">{{ ds.path }}</p>
            </div>
            <p class="text-xs text-gray-500 truncate max-w-sm hidden lg:block">{{ ds.description || '—' }}</p>
            <div class="flex items-center gap-4 text-xs text-gray-400 shrink-0">
              <span class="flex items-center gap-1"><el-icon><Star /></el-icon>{{ ds.likes ?? 0 }}</span>
              <span class="flex items-center gap-1"><el-icon><Download /></el-icon>{{ ds.downloads ?? 0 }}</span>
              <span>{{ formatDate(ds.updated_at) }}</span>
            </div>
          </div>
        </div>
        <div v-if="dsTotal > perPage" class="flex justify-center mt-8">
          <el-pagination
            v-model:current-page="dsPage"
            :page-size="perPage"
            :total="dsTotal"
            layout="prev, pager, next"
            @current-change="fetchDatasets"
          />
        </div>
      </div>
    </div>

    <!-- ===================== SPACES TAB ===================== -->
    <div v-else-if="activeTab === 'spaces'">
      <div class="bg-white border-b border-gray-100 py-6 px-6">
        <div class="max-w-7xl mx-auto">
          <div class="flex flex-col md:flex-row md:items-end gap-4 mb-4">
            <div class="flex-1">
              <h2 class="text-lg font-bold text-gray-900 mb-1">{{ t('home.spaceHub') }}</h2>
            </div>
            <div class="flex items-center gap-3 flex-wrap">
              <el-input
                v-model="spSearch"
                :placeholder="t('modelHub.searchPlaceholder')"
                :prefix-icon="Search"
                clearable
                style="width: 240px"
                @input="onSpSearch"
              />
              <el-select v-model="spSortBy" size="default" style="width: 140px" @change="fetchSpaces">
                <el-option value="recently_update" :label="t('modelHub.sortRecent')" />
                <el-option value="trending"        :label="t('modelHub.sortTrending')" />
                <el-option value="most_download"   :label="t('modelHub.sortDownload')" />
                <el-option value="most_like"       :label="t('modelHub.sortLike')" />
              </el-select>
              <el-radio-group v-model="spViewMode" size="small">
                <el-radio-button value="grid"><el-icon><Grid /></el-icon></el-radio-button>
                <el-radio-button value="list"><el-icon><List /></el-icon></el-radio-button>
              </el-radio-group>
            </div>
          </div>
          <div class="text-sm text-gray-400">{{ t('modelHub.total', { count: spTotal }) }}</div>
        </div>
      </div>
      <div class="max-w-7xl mx-auto px-6 py-6">
        <div v-if="spLoading" class="flex justify-center py-24">
          <el-icon class="animate-spin text-blue-500 text-4xl"><Loading /></el-icon>
        </div>
        <el-empty v-else-if="spaces.length === 0" :description="t('modelHub.empty')" class="py-24" />
        <div v-else-if="spViewMode === 'grid'" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <div
            v-for="sp in spaces"
            :key="sp.path"
            class="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer flex flex-col"
          >
            <div class="flex items-start justify-between mb-3">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center text-white font-bold text-base shrink-0">
                {{ avatarChar(sp) }}
              </div>
              <el-tag size="small" :type="sp.private ? 'warning' : 'success'">
                {{ sp.private ? 'Private' : 'Public' }}
              </el-tag>
            </div>
            <h3 class="font-semibold text-gray-900 mb-0.5 truncate text-sm">{{ sp.nickname || sp.name }}</h3>
            <p class="text-xs text-gray-400 mb-2 truncate">{{ sp.path }}</p>
            <p class="text-xs text-gray-500 mb-4 line-clamp-2 leading-relaxed flex-1">{{ sp.description || t('modelHub.noDescription') }}</p>
            <div class="flex items-center justify-between text-xs text-gray-400">
              <div class="flex items-center gap-3">
                <span class="flex items-center gap-1"><el-icon><Star /></el-icon>{{ sp.likes ?? 0 }}</span>
              </div>
              <span>{{ formatDate(sp.updated_at) }}</span>
            </div>
          </div>
        </div>
        <div v-else class="space-y-2">
          <div
            v-for="sp in spaces"
            :key="sp.path"
            class="bg-white rounded-xl border border-gray-200 px-5 py-4 flex items-center gap-4 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
          >
            <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {{ avatarChar(sp) }}
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-0.5">
                <span class="font-semibold text-gray-900 text-sm">{{ sp.nickname || sp.name }}</span>
                <el-tag size="small" :type="sp.private ? 'warning' : 'success'" class="shrink-0">{{ sp.private ? 'Private' : 'Public' }}</el-tag>
              </div>
              <p class="text-xs text-gray-400 truncate">{{ sp.path }}</p>
            </div>
            <p class="text-xs text-gray-500 truncate max-w-sm hidden lg:block">{{ sp.description || '—' }}</p>
            <div class="flex items-center gap-4 text-xs text-gray-400 shrink-0">
              <span class="flex items-center gap-1"><el-icon><Star /></el-icon>{{ sp.likes ?? 0 }}</span>
              <span>{{ formatDate(sp.updated_at) }}</span>
            </div>
          </div>
        </div>
        <div v-if="spTotal > perPage" class="flex justify-center mt-8">
          <el-pagination
            v-model:current-page="spPage"
            :page-size="perPage"
            :total="spTotal"
            layout="prev, pager, next"
            @current-change="fetchSpaces"
          />
        </div>
      </div>
    </div>

    <!-- Footer -->
    <footer class="py-6 border-t border-gray-100 text-center text-xs text-gray-400 mt-8">
      © {{ new Date().getFullYear() }} aitra · Powered by OpenCSG
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Search, Star, Download, Grid, List, Loading, ChatDotRound } from '@element-plus/icons-vue'
import { useAuthStore } from '../stores/auth'
import api from '../api/index'

const { t, locale } = useI18n()
const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const currentLang = ref(locale.value)

function changeLang(lang: string) {
  locale.value = lang
  localStorage.setItem('lang', lang)
}

// ---- Tab management ----
type TabKey = 'models' | 'datasets' | 'spaces'

const tabs = computed(() => [
  { key: 'models' as TabKey,   label: t('home.nav.modelHub') },
  { key: 'datasets' as TabKey, label: t('home.datasetHub') },
  { key: 'spaces' as TabKey,   label: t('home.spaceHub') },
])

const activeTab = ref<TabKey>((route.query.tab as TabKey) || 'models')

function switchTab(key: TabKey) {
  activeTab.value = key
  router.replace({ query: { tab: key } })
  if (key === 'datasets' && datasets.value.length === 0) fetchDatasets()
  if (key === 'spaces'   && spaces.value.length   === 0) fetchSpaces()
}

// ---- Shared ----
interface RepoItem {
  path: string
  name: string
  nickname?: string
  description?: string
  private: boolean
  likes?: number
  downloads?: number
  updated_at?: string
}

const perPage = 24

function avatarChar(m: { nickname?: string; name: string }) {
  return (m.nickname || m.name || '?').charAt(0).toUpperCase()
}

function formatDate(s?: string) {
  if (!s) return ''
  const d = new Date(s)
  const days = Math.floor((Date.now() - d.getTime()) / 86400000)
  if (days === 0) return t('modelHub.today')
  if (days === 1) return t('modelHub.yesterday')
  if (days < 30) return t('modelHub.daysAgo', { n: days })
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

// ---- AI 模型 (public llm_configs) ----
interface AIModel {
  id: number
  model_name: string
  api_endpoint: string
  provider: string
  enabled: boolean
}

const aiModels = ref<AIModel[]>([])
const aiModelsLoading = ref(false)

// Provider → badge color mapping
const providerColors: Record<string, { bg: string; text: string }> = {
  anthropic:  { bg: '#d97706', text: '#fff' },
  openai:     { bg: '#10b981', text: '#fff' },
  google:     { bg: '#3b82f6', text: '#fff' },
  mistral:    { bg: '#8b5cf6', text: '#fff' },
  meta:       { bg: '#1d4ed8', text: '#fff' },
  deepseek:   { bg: '#0ea5e9', text: '#fff' },
}

function providerBadgeStyle(provider: string) {
  const key = (provider || '').toLowerCase()
  const colors = providerColors[key] || { bg: '#6b7280', text: '#fff' }
  return { backgroundColor: colors.bg, color: colors.text }
}

function tryAiModel() {
  if (auth.isLoggedIn) {
    router.push('/app/models')
  } else {
    router.push('/login')
  }
}

async function fetchAiModels() {
  aiModelsLoading.value = true
  try {
    const res = await api.get<{ data: AIModel[] }>('/public/llm_configs')
    aiModels.value = res.data?.data ?? []
  } catch {
    aiModels.value = []
  } finally {
    aiModelsLoading.value = false
  }
}

// ---- Model repo ----
const models    = ref<RepoItem[]>([])
const loading   = ref(false)
const searchQuery = ref('')
const sortBy    = ref('recently_update')
const viewMode  = ref<'grid' | 'list'>('grid')
const page      = ref(1)
const total     = ref(0)

let searchTimer: ReturnType<typeof setTimeout>

function onSearch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { page.value = 1; fetchModels() }, 400)
}

async function fetchModels() {
  loading.value = true
  try {
    const params = new URLSearchParams({ per: String(perPage), page: String(page.value), sort: sortBy.value })
    if (searchQuery.value) params.set('search', searchQuery.value)
    const res = await api.get<{ data: RepoItem[]; total: number }>(`/models?${params}`)
    models.value = res.data?.data ?? []
    total.value = res.data?.total ?? models.value.length
  } catch {
    models.value = []
  } finally {
    loading.value = false
  }
}

function openModel(model: RepoItem) {
  router.push({ path: '/app/models', query: { model: model.path } })
}

// ---- Datasets ----
const datasets   = ref<RepoItem[]>([])
const dsLoading  = ref(false)
const dsSearch   = ref('')
const dsSortBy   = ref('recently_update')
const dsViewMode = ref<'grid' | 'list'>('grid')
const dsPage     = ref(1)
const dsTotal    = ref(0)

let dsSearchTimer: ReturnType<typeof setTimeout>

function onDsSearch() {
  clearTimeout(dsSearchTimer)
  dsSearchTimer = setTimeout(() => { dsPage.value = 1; fetchDatasets() }, 400)
}

async function fetchDatasets() {
  dsLoading.value = true
  try {
    const params = new URLSearchParams({ per: String(perPage), page: String(dsPage.value), sort: dsSortBy.value })
    if (dsSearch.value) params.set('search', dsSearch.value)
    const res = await api.get<{ data: RepoItem[]; total: number }>(`/datasets?${params}`)
    datasets.value = res.data?.data ?? []
    dsTotal.value = res.data?.total ?? datasets.value.length
  } catch {
    datasets.value = []
  } finally {
    dsLoading.value = false
  }
}

// ---- Spaces ----
const spaces     = ref<RepoItem[]>([])
const spLoading  = ref(false)
const spSearch   = ref('')
const spSortBy   = ref('recently_update')
const spViewMode = ref<'grid' | 'list'>('grid')
const spPage     = ref(1)
const spTotal    = ref(0)

let spSearchTimer: ReturnType<typeof setTimeout>

function onSpSearch() {
  clearTimeout(spSearchTimer)
  spSearchTimer = setTimeout(() => { spPage.value = 1; fetchSpaces() }, 400)
}

async function fetchSpaces() {
  spLoading.value = true
  try {
    const params = new URLSearchParams({ per: String(perPage), page: String(spPage.value), sort: spSortBy.value })
    if (spSearch.value) params.set('search', spSearch.value)
    const res = await api.get<{ data: RepoItem[]; total: number }>(`/spaces?${params}`)
    spaces.value = res.data?.data ?? []
    spTotal.value = res.data?.total ?? spaces.value.length
  } catch {
    spaces.value = []
  } finally {
    spLoading.value = false
  }
}

// ---- Init ----
if (auth.isLoggedIn) {
  router.replace('/app/models')
} else {
  fetchAiModels()
  fetchModels()
}
</script>
