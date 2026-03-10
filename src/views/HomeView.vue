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
          <div class="hidden md:flex items-center gap-1">
            <button class="px-3 py-1.5 text-sm rounded-md bg-blue-50 text-blue-600 font-medium">
              {{ t('home.nav.modelHub') }}
            </button>
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

    <!-- Compact hero + search -->
    <div class="bg-white border-b border-gray-100 py-8 px-6">
      <div class="max-w-7xl mx-auto">
        <div class="flex flex-col md:flex-row md:items-end gap-4 mb-6">
          <div class="flex-1">
            <h1 class="text-2xl font-bold text-gray-900 mb-1">{{ t('home.nav.modelHub') }}</h1>
            <p class="text-gray-500 text-sm">{{ t('modelHub.subtitle') }}</p>
          </div>
          <div class="flex items-center gap-3 flex-wrap">
            <el-input
              v-model="searchQuery"
              :placeholder="t('modelHub.searchPlaceholder')"
              :prefix-icon="Search"
              clearable
              style="width: 260px"
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

        <!-- Stats row -->
        <div class="flex items-center gap-6 text-sm text-gray-400">
          <span>{{ t('modelHub.total', { count: total }) }}</span>
          <span v-if="searchQuery" class="text-blue-500">
            "{{ searchQuery }}" · <button class="underline" @click="searchQuery=''; fetchModels()">{{ t('modelHub.clearSearch') }}</button>
          </span>
        </div>
      </div>
    </div>

    <!-- Model list -->
    <div class="max-w-7xl mx-auto px-6 py-6">
      <!-- Loading -->
      <div v-if="loading" class="flex justify-center py-24">
        <el-icon class="animate-spin text-blue-500 text-4xl"><Loading /></el-icon>
      </div>

      <!-- Empty -->
      <el-empty v-else-if="models.length === 0" :description="searchQuery ? t('modelHub.noResults') : t('modelHub.empty')" class="py-24">
        <el-button v-if="!searchQuery" type="primary" @click="router.push('/register')">
          {{ t('nav.register') }}
        </el-button>
      </el-empty>

      <!-- Grid -->
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

      <!-- List -->
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
          <el-button size="small" type="primary" plain class="shrink-0">
            <el-icon class="mr-1"><ChatDotRound /></el-icon>{{ t('models.tryIt') }}
          </el-button>
        </div>
      </div>

      <!-- Pagination -->
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

    <!-- Footer -->
    <footer class="py-6 border-t border-gray-100 text-center text-xs text-gray-400 mt-8">
      © {{ new Date().getFullYear() }} aitra · Powered by OpenCSG
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Search } from '@element-plus/icons-vue'
import { useAuthStore } from '../stores/auth'
import api from '../api/index'

const { t, locale } = useI18n()
const router = useRouter()
const auth = useAuthStore()
const currentLang = ref(locale.value)

function changeLang(lang: string) {
  locale.value = lang
  localStorage.setItem('lang', lang)
}

interface ModelItem {
  path: string
  name: string
  nickname?: string
  description?: string
  private: boolean
  likes?: number
  downloads?: number
  updated_at?: string
}

const models    = ref<ModelItem[]>([])
const loading   = ref(false)
const searchQuery = ref('')
const sortBy    = ref('recently_update')
const viewMode  = ref<'grid' | 'list'>('grid')
const page      = ref(1)
const perPage   = 24
const total     = ref(0)

let searchTimer: ReturnType<typeof setTimeout>

function onSearch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { page.value = 1; fetchModels() }, 400)
}

function avatarChar(m: ModelItem) {
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

async function fetchModels() {
  loading.value = true
  try {
    const params = new URLSearchParams({ per: String(perPage), page: String(page.value), sort: sortBy.value })
    if (searchQuery.value) params.set('search', searchQuery.value)
    const res = await api.get<{ data: ModelItem[]; total: number }>(`/models?${params}`)
    models.value = res.data?.data ?? []
    total.value = res.data?.total ?? models.value.length
  } catch {
    models.value = []
  } finally {
    loading.value = false
  }
}

function openModel(model: ModelItem) {
  const parts = model.path.split('/')
  router.push({ path: '/app/models', query: { model: model.path } })
}

// Auto-redirect logged-in users to app
if (auth.isLoggedIn) {
  router.replace('/app/models')
}

fetchModels()
</script>
