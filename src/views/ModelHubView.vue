<template>
  <div class="min-h-screen bg-gray-50">
    <TopNav />

    <div class="max-w-7xl mx-auto px-6 py-6">
      <el-tabs v-model="activeTab">
        <!-- ─── TAB 1: Platform Models ─── -->
        <el-tab-pane :label="t('modelHub.tabs.platform')" name="platform">
          <div class="mb-4">
            <h2 class="text-lg font-bold text-gray-900 mb-1">{{ t('modelHub.title') }}</h2>
            <p class="text-gray-500 text-sm">{{ t('modelHub.subtitle') }}</p>
          </div>

          <HubToolbar
            v-model:search-query="searchQuery"
            v-model:sort-by="sortBy"
            v-model:view-mode="viewMode"
            :total="total"
            class="mb-4"
            @update:search-query="onSearchChange"
            @update:sort-by="onSortChange"
          />

          <div v-if="loading" class="flex justify-center py-24">
            <el-icon class="animate-spin text-blue-500 text-4xl"><Loading /></el-icon>
          </div>

          <el-empty
            v-else-if="models.length === 0"
            :description="searchQuery ? t('modelHub.noResults') : t('modelHub.empty')"
            class="py-24"
          >
            <el-button v-if="searchQuery" @click="clearSearch">{{ t('modelHub.clearSearch') }}</el-button>
            <el-button v-else type="primary" @click="router.push('/register')">{{ t('nav.register') }}</el-button>
          </el-empty>

          <!-- Grid view -->
          <div
            v-else-if="viewMode === 'grid'"
            class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            <RepoCard
              v-for="model in models"
              :key="model.path"
              :item="model"
              type="model"
              layout="grid"
              @click="openModel(model)"
            />
          </div>

          <!-- List view -->
          <div v-else class="space-y-2">
            <RepoCard
              v-for="model in models"
              :key="model.path"
              :item="model"
              type="model"
              layout="list"
              @click="openModel(model)"
            />
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
        </el-tab-pane>

        <!-- ─── TAB 2: AI Services ─── -->
        <el-tab-pane :label="t('modelHub.tabs.aiServices')" name="aiServices">
          <!-- Section A: External AI Models -->
          <div class="mb-10">
            <h3 class="text-base font-semibold text-gray-800 mb-4">
              {{ t('modelHub.aiServices.externalModels') }}
            </h3>

            <div v-if="aiModelsLoading" class="flex justify-center py-8">
              <el-icon class="animate-spin text-blue-500 text-2xl"><Loading /></el-icon>
            </div>

            <p v-else-if="aiModels.length === 0" class="text-sm text-gray-400 py-4">
              {{ t('modelHub.aiServices.noExternalModels') }}
            </p>

            <div
              v-else
              class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            >
              <div
                v-for="m in aiModels"
                :key="m.id"
                class="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col gap-2"
              >
                <div class="flex items-start justify-between gap-2">
                  <h4 class="font-semibold text-gray-900 text-sm truncate flex-1">{{ m.model_name }}</h4>
                  <span
                    :class="m.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'"
                    class="text-xs px-2 py-0.5 rounded-full whitespace-nowrap shrink-0"
                  >
                    ● {{ m.enabled ? 'Active' : 'Inactive' }}
                  </span>
                </div>
                <p class="text-xs text-gray-500">Provider: {{ m.provider }}</p>
                <p class="text-xs text-gray-400 truncate">API: {{ m.api_endpoint }}</p>
                <el-button size="small" type="primary" plain class="mt-auto" @click="handleTryModel()">
                  {{ t('modelHub.aiServices.tryPlayground') }}
                </el-button>
              </div>
            </div>
          </div>

          <!-- Section B: GPU Deployments -->
          <div>
            <h3 class="text-base font-semibold text-gray-800 mb-4">
              {{ t('modelHub.aiServices.gpuDeployments') }}
            </h3>

            <p v-if="!auth.isLoggedIn" class="text-sm text-gray-400 py-4">
              {{ t('modelHub.aiServices.loginForDeployments') }}
            </p>

            <div v-else-if="gpuLoading" class="flex justify-center py-8">
              <el-icon class="animate-spin text-blue-500 text-2xl"><Loading /></el-icon>
            </div>

            <p v-else-if="gpuDeployments.length === 0" class="text-sm text-gray-400 py-4">
              {{ t('modelHub.aiServices.noDeployments') }}
            </p>

            <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div
                v-for="d in gpuDeployments"
                :key="d.id"
                class="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col gap-2"
              >
                <div class="flex items-start justify-between gap-2">
                  <h4 class="font-semibold text-gray-900 text-sm truncate flex-1">{{ d.deploy_name }}</h4>
                  <span
                    :class="gpuStatusClass(d.status)"
                    class="text-xs px-2 py-0.5 rounded-full whitespace-nowrap shrink-0"
                  >
                    ● {{ gpuStatusLabel(d.status) }}
                  </span>
                </div>
                <p class="text-xs text-gray-500">SKU: {{ d.sku_name }}</p>
                <p class="text-xs text-gray-400">Since: {{ formatDate(d.started_at) }}</p>
                <div class="flex gap-2 mt-auto">
                  <el-button
                    v-if="d.status === 'running'"
                    size="small"
                    @click="handleStopDeployment(d.id)"
                  >
                    {{ t('gpu.stop') }}
                  </el-button>
                  <el-button
                    size="small"
                    type="danger"
                    plain
                    @click="handleDeleteDeployment(d.id)"
                  >
                    {{ t('gpu.delete') }}
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <!-- ─── TAB 3: HF Sync ─── -->
        <el-tab-pane :label="t('modelHub.tabs.hfSync')" name="hfSync">
          <div class="mb-6">
            <h3 class="text-base font-semibold text-gray-800 mb-4">{{ t('modelHub.hfSync.title') }}</h3>
            <div class="flex gap-3">
              <el-input
                v-model="hfQuery"
                :placeholder="t('modelHub.hfSync.searchPlaceholder')"
                class="flex-1"
                clearable
                @keyup.enter="doHFSearch"
              />
              <el-button type="primary" :loading="hfSearching" @click="doHFSearch">
                {{ t('modelHub.hfSync.search') }}
              </el-button>
            </div>
          </div>

          <div v-if="hfSearching" class="flex justify-center py-12">
            <el-icon class="animate-spin text-blue-500 text-4xl"><Loading /></el-icon>
          </div>

          <p
            v-else-if="hfSearched && hfResults.length === 0"
            class="text-sm text-gray-400 py-8 text-center"
          >
            {{ t('modelHub.hfSync.noResults') }}
          </p>

          <p
            v-else-if="!hfSearched && hfResults.length === 0"
            class="text-sm text-gray-400 py-8 text-center"
          >
            {{ t('modelHub.hfSync.searchHint') }}
          </p>

          <div
            v-else
            class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            <div
              v-for="hm in hfResults"
              :key="hm.id"
              class="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col gap-2"
            >
              <h4 class="font-semibold text-gray-900 text-sm leading-snug break-all">{{ hm.id }}</h4>
              <div class="flex items-center gap-3 text-xs text-gray-500">
                <span>❤ {{ formatNum(hm.likes) }}</span>
                <span>↓ {{ formatNum(hm.downloads) }}</span>
                <span v-if="hm.gated" class="text-orange-500">{{ t('modelHub.hfSync.gated') }}</span>
              </div>
              <p class="text-xs text-gray-400 line-clamp-2">{{ hm.tags.slice(0, 4).join(', ') }}</p>
              <el-button size="small" type="primary" class="mt-auto" @click="openImportDialog(hm)">
                {{ t('modelHub.hfSync.importBtn') }}
              </el-button>
            </div>
          </div>

          <!-- Import Dialog -->
          <el-dialog
            v-model="importDialogVisible"
            :title="t('modelHub.hfSync.importTitle')"
            width="600px"
            :close-on-click-modal="false"
          >
            <!-- Metadata loading -->
            <div v-if="detailLoading" class="flex items-center gap-2 mb-4 text-sm text-gray-500 py-2">
              <el-icon class="animate-spin"><Loading /></el-icon>
              {{ t('modelHub.hfSync.loadingMeta') }}
            </div>

            <!-- File list preview -->
            <div v-if="hfDetail && !detailLoading" class="mb-4 bg-gray-50 rounded-lg border border-gray-200 p-3">
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-semibold text-gray-600">{{ t('modelHub.hfSync.fileList') }}</span>
                <div class="flex items-center gap-2 text-xs text-gray-500">
                  <span>{{ hfDetail.files.length }} {{ t('modelHub.hfSync.files') }}</span>
                  <el-tag v-if="hfDetail.has_lfs" type="warning" size="small" effect="plain">LFS</el-tag>
                </div>
              </div>
              <div class="max-h-32 overflow-y-auto space-y-1">
                <div
                  v-for="f in hfDetail.files.slice(0, 30)"
                  :key="f.path"
                  class="flex items-center justify-between text-xs font-mono"
                >
                  <span class="text-gray-700 truncate max-w-[300px]">
                    {{ f.type === 'directory' ? '📁' : '📄' }} {{ f.path }}
                  </span>
                  <span class="text-gray-400 shrink-0 ml-2">
                    {{ f.lfs ? formatSize(f.lfs.size) : (f.size ? formatSize(f.size) : '') }}
                    <el-tag v-if="f.lfs" type="warning" size="small" class="ml-1">lfs</el-tag>
                  </span>
                </div>
              </div>
            </div>

            <el-form label-width="110px" label-position="left">
              <el-form-item :label="t('modelHub.hfSync.hfModelId')">
                <el-input :model-value="importForm.hf_model_id" disabled />
              </el-form-item>
              <el-form-item :label="t('modelHub.hfSync.targetName')">
                <el-input v-model="importForm.target_name" />
              </el-form-item>
              <el-form-item :label="t('modelHub.hfSync.license')">
                <el-select v-model="importForm.license" class="w-full">
                  <el-option label="MIT" value="mit" />
                  <el-option label="Apache 2.0" value="apache-2.0" />
                  <el-option label="CC BY 4.0" value="cc-by-4.0" />
                  <el-option label="CC BY-SA 4.0" value="cc-by-sa-4.0" />
                  <el-option label="GPL 3.0" value="gpl-3.0" />
                  <el-option label="Other" value="other" />
                </el-select>
              </el-form-item>
              <el-form-item :label="t('modelHub.hfSync.syncLfs')">
                <div class="flex items-center gap-2">
                  <el-checkbox v-model="importForm.sync_lfs" />
                  <span class="text-xs" :class="hfDetail?.has_lfs ? 'text-orange-500 font-medium' : 'text-gray-400'">
                    {{ hfDetail?.has_lfs ? t('modelHub.hfSync.syncLfsRequired') : t('modelHub.hfSync.syncLfsTip') }}
                  </span>
                </div>
              </el-form-item>
              <el-form-item :label="t('modelHub.hfSync.description')">
                <el-input v-model="importForm.description" type="textarea" :rows="3"
                  :placeholder="t('modelHub.hfSync.descPlaceholder')" />
              </el-form-item>
            </el-form>

            <!-- README preview -->
            <div v-if="hfDetail?.readme" class="mt-2">
              <div class="text-xs font-semibold text-gray-500 mb-1">README 预览</div>
              <div class="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-600 max-h-24 overflow-y-auto whitespace-pre-wrap font-mono">
                {{ hfDetail.readme.slice(0, 500) }}{{ hfDetail.readme.length > 500 ? '...' : '' }}
              </div>
            </div>

            <template #footer>
              <el-button @click="importDialogVisible = false">{{ t('common.cancel') }}</el-button>
              <el-button type="primary" :loading="importing" @click="doImport">
                {{ importing ? t('modelHub.hfSync.importing') : t('modelHub.hfSync.importBtn') }}
              </el-button>
            </template>
          </el-dialog>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import TopNav from '../components/TopNav.vue'
import RepoCard from '../components/RepoCard.vue'
import HubToolbar from '../components/HubToolbar.vue'
import { useAuthStore } from '../stores/auth'
import api from '../api/index'
import { listMyDeployments, stopDeployment, deleteDeployment } from '../api/gpu'
import type { DeploymentWithCost } from '../api/gpu'
import { searchHFModels, importHFModel, fetchHFModelDetail } from '../api/hf'
import type { HFModel, HFModelDetail } from '../api/hf'

const { t } = useI18n()
const router = useRouter()
const auth = useAuthStore()

// ─── Active tab ────────────────────────────────────────────────────────────────
const activeTab = ref<'platform' | 'aiServices' | 'hfSync'>('platform')

// ─── Platform Models (Tab 1) ───────────────────────────────────────────────────
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

const models = ref<RepoItem[]>([])
const loading = ref(false)
const searchQuery = ref('')
const sortBy = ref('recently_update')
const viewMode = ref<'grid' | 'list'>('grid')
const page = ref(1)
const total = ref(0)
const perPage = 24

let searchTimer: ReturnType<typeof setTimeout>

function onSearchChange(val: string) {
  searchQuery.value = val
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    page.value = 1
    fetchModels()
  }, 400)
}

function onSortChange(val: string) {
  sortBy.value = val
  page.value = 1
  fetchModels()
}

function clearSearch() {
  searchQuery.value = ''
  page.value = 1
  fetchModels()
}

function openModel(model: RepoItem) {
  router.push({ path: '/app/playground', query: { model: model.path } })
}

async function fetchModels() {
  loading.value = true
  try {
    const params = new URLSearchParams({
      per: String(perPage),
      page: String(page.value),
      sort: sortBy.value,
    })
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

// ─── AI Services (Tab 2) ──────────────────────────────────────────────────────
interface AIModel {
  id: number
  model_name: string
  api_endpoint: string
  provider: string
  enabled: boolean
}

const aiModels = ref<AIModel[]>([])
const aiModelsLoading = ref(false)

async function fetchAiModels() {
  aiModelsLoading.value = true
  try {
    const res = await api.get<{ data: AIModel[] }>('/public/llm_configs')
    aiModels.value = (res.data?.data ?? []).filter((m) => m.enabled)
  } catch {
    aiModels.value = []
  } finally {
    aiModelsLoading.value = false
  }
}

function handleTryModel() {
  if (auth.isLoggedIn) {
    router.push('/app/playground')
  } else {
    router.push('/login')
  }
}

// GPU Deployments
const gpuDeployments = ref<DeploymentWithCost[]>([])
const gpuLoading = ref(false)

async function fetchGpuDeployments() {
  if (!auth.isLoggedIn) return
  gpuLoading.value = true
  try {
    const res = await listMyDeployments()
    gpuDeployments.value = res.data?.data ?? []
  } catch {
    gpuDeployments.value = []
  } finally {
    gpuLoading.value = false
  }
}

function gpuStatusClass(status: string): string {
  const map: Record<string, string> = {
    running: 'bg-green-100 text-green-700',
    stopped: 'bg-gray-100 text-gray-500',
    pending: 'bg-yellow-100 text-yellow-700',
    failed: 'bg-red-100 text-red-700',
  }
  return map[status] ?? 'bg-gray-100 text-gray-500'
}

function gpuStatusLabel(status: string): string {
  const map: Record<string, string> = {
    running: t('gpu.running'),
    stopped: t('gpu.stopped'),
    pending: t('deployments.status.pending'),
    failed: t('deployments.status.failed'),
  }
  return map[status] ?? status
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString()
}

async function handleStopDeployment(id: number) {
  try {
    await ElMessageBox.confirm(t('gpu.confirmStop'), { type: 'warning' })
  } catch {
    return
  }
  try {
    await stopDeployment(id)
    ElMessage.success(t('gpu.stopSuccess'))
    fetchGpuDeployments()
  } catch {
    ElMessage.error(t('common.error'))
  }
}

async function handleDeleteDeployment(id: number) {
  try {
    await ElMessageBox.confirm(t('gpu.confirmDelete'), { type: 'warning' })
  } catch {
    return
  }
  try {
    await deleteDeployment(id)
    ElMessage.success(t('gpu.deleteSuccess'))
    fetchGpuDeployments()
  } catch {
    ElMessage.error(t('common.error'))
  }
}

// ─── HF Sync (Tab 3) ──────────────────────────────────────────────────────────
const hfQuery = ref('')
const hfResults = ref<HFModel[]>([])
const hfSearching = ref(false)
const hfSearched = ref(false)

async function doHFSearch() {
  const q = hfQuery.value.trim()
  if (!q) return
  hfSearching.value = true
  hfSearched.value = false
  try {
    hfResults.value = await searchHFModels(q)
    hfSearched.value = true
  } catch {
    hfResults.value = []
    hfSearched.value = true
  } finally {
    hfSearching.value = false
  }
}

function formatNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'k'
  return String(n)
}

// Import dialog
const importDialogVisible = ref(false)
const importing = ref(false)
const detailLoading = ref(false)
const hfDetail = ref<HFModelDetail | null>(null)
const importForm = reactive({
  hf_model_id: '',
  target_name: '',
  description: '',
  license: 'other',
  sync_lfs: false,
})

function formatSize(bytes: number): string {
  if (bytes >= 1_073_741_824) return (bytes / 1_073_741_824).toFixed(1) + ' GB'
  if (bytes >= 1_048_576) return (bytes / 1_048_576).toFixed(1) + ' MB'
  if (bytes >= 1_024) return (bytes / 1_024).toFixed(1) + ' KB'
  return bytes + ' B'
}

async function openImportDialog(model: HFModel) {
  importForm.hf_model_id = model.id
  importForm.target_name = model.id.split('/').pop() ?? model.id
  importForm.description = ''
  importForm.license = model.cardData?.license ?? 'other'
  importForm.sync_lfs = false
  hfDetail.value = null
  importDialogVisible.value = true

  // Fetch full metadata in background
  detailLoading.value = true
  try {
    const res = await fetchHFModelDetail(model.id)
    hfDetail.value = res.data?.data ?? null
    if (hfDetail.value) {
      // Auto-check sync_lfs if model has LFS files
      if (hfDetail.value.has_lfs) importForm.sync_lfs = true
      // Auto-fill license from model card
      if (!importForm.license || importForm.license === 'other') {
        importForm.license = hfDetail.value.info?.cardData?.license ?? 'other'
      }
    }
  } catch {
    // non-fatal, proceed without detail
  } finally {
    detailLoading.value = false
  }
}

async function doImport() {
  if (!auth.isLoggedIn) {
    router.push('/login')
    return
  }
  importing.value = true
  try {
    await importHFModel(auth.username, {
      hf_model_id: importForm.hf_model_id,
      target_name: importForm.target_name,
      description: importForm.description,
      license: importForm.license,
      sync_lfs: importForm.sync_lfs,
    })
    importDialogVisible.value = false
    ElMessage.success(t('modelHub.hfSync.importSuccess'))
    setTimeout(() => {
      activeTab.value = 'platform'
      fetchModels()
    }, 2000)
  } catch {
    ElMessage.error(t('modelHub.hfSync.importError'))
  } finally {
    importing.value = false
  }
}

// ─── Mount ────────────────────────────────────────────────────────────────────
onMounted(() => {
  fetchModels()
  fetchAiModels()
  if (auth.isLoggedIn) {
    fetchGpuDeployments()
  }
})
</script>
