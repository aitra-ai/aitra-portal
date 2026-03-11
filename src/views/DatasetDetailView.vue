<template>
  <div class="min-h-screen bg-gray-50">
    <TopNav />

    <section class="py-6 px-6">
      <div class="max-w-5xl mx-auto">

        <!-- Breadcrumb / back -->
        <div class="flex items-center gap-2 mb-6 text-sm text-gray-500">
          <router-link to="/datasets" class="flex items-center gap-1 hover:text-blue-600 transition-colors">
            <el-icon><ArrowLeft /></el-icon>
            {{ t('datasetHub.backToHub') }}
          </router-link>
          <span>/</span>
          <span class="text-gray-700 font-medium">{{ namespace }}</span>
          <span>/</span>
          <span class="text-gray-900 font-semibold">{{ name }}</span>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="flex justify-center py-24">
          <el-icon class="animate-spin text-blue-500 text-4xl"><Loading /></el-icon>
        </div>

        <!-- Error -->
        <el-empty v-else-if="!dataset" description="Dataset not found" class="py-24" />

        <!-- Content -->
        <template v-else>
          <!-- Header card -->
          <div class="bg-white rounded-xl border border-gray-200 p-6 mb-4">
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-3 mb-1">
                  <div
                    class="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-base shrink-0 bg-gradient-to-br from-green-500 to-teal-600"
                  >
                    {{ avatarChar }}
                  </div>
                  <div>
                    <h1 class="text-xl font-bold text-gray-900">
                      {{ dataset.nickname || dataset.name }}
                    </h1>
                    <p class="text-sm text-gray-500">{{ dataset.path }}</p>
                  </div>
                </div>

                <div class="flex flex-wrap items-center gap-2 mt-3">
                  <el-tag :type="dataset.private ? 'warning' : 'success'" size="small">
                    {{ dataset.private ? t('datasetHub.visibilityPrivate') : t('datasetHub.visibilityPublic') }}
                  </el-tag>
                  <el-tag v-if="dataset.license" size="small" type="info">
                    {{ dataset.license }}
                  </el-tag>
                </div>

                <p v-if="dataset.description" class="mt-3 text-sm text-gray-600">
                  {{ dataset.description }}
                </p>
              </div>

              <!-- Stats + actions -->
              <div class="flex flex-col items-end gap-3 shrink-0">
                <div class="flex items-center gap-4 text-sm text-gray-500">
                  <span class="flex items-center gap-1">
                    <el-icon><Star /></el-icon>{{ dataset.likes ?? 0 }}
                  </span>
                  <span class="flex items-center gap-1">
                    <el-icon><Download /></el-icon>{{ dataset.downloads ?? 0 }}
                  </span>
                </div>
                <el-button
                  v-if="isOwner"
                  type="danger"
                  size="small"
                  :loading="deleting"
                  @click="handleDelete"
                >
                  <el-icon class="mr-1"><Delete /></el-icon>
                  {{ t('common.delete') }}
                </el-button>
              </div>
            </div>
          </div>

          <!-- Tabs -->
          <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <el-tabs v-model="activeTab" class="px-4" @tab-change="onTabChange">
              <el-tab-pane :label="t('datasetHub.readme')" name="readme">
                <div class="p-4">
                  <pre
                    v-if="dataset.readme"
                    class="text-sm text-gray-700 whitespace-pre-wrap font-mono bg-gray-50 rounded-lg p-4 leading-relaxed"
                  >{{ dataset.readme }}</pre>
                  <el-empty v-else :description="t('datasetHub.noReadme')" class="py-12" />
                </div>
              </el-tab-pane>

              <!-- Files tab -->
              <el-tab-pane :label="t('datasetHub.files')" name="files">
                <div class="p-4">
                  <!-- Toolbar -->
                  <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center gap-2 text-sm text-gray-600">
                      <el-icon><BranchIcon /></el-icon>
                      <span class="font-mono font-medium">{{ currentBranch }}</span>
                    </div>
                    <el-button
                      v-if="isOwner"
                      type="primary"
                      size="small"
                      @click="showUploadDialog = true"
                    >
                      <el-icon class="mr-1"><Upload /></el-icon>
                      {{ t('datasetHub.uploadFiles') }}
                    </el-button>
                  </div>

                  <!-- Loading state -->
                  <div v-if="filesLoading" class="flex justify-center py-12">
                    <el-icon class="animate-spin text-blue-500 text-3xl"><Loading /></el-icon>
                  </div>

                  <!-- File list -->
                  <template v-else-if="fileList.length > 0">
                    <div class="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
                      <div
                        v-for="entry in fileList"
                        :key="entry.path"
                        class="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                      >
                        <span class="text-lg shrink-0">{{ entry.type === 'dir' ? '📁' : '📄' }}</span>
                        <span class="flex-1 text-sm font-medium text-gray-800 truncate">{{ entry.name }}</span>
                        <span class="text-xs text-gray-400 shrink-0 w-20 text-right">
                          {{ entry.size != null ? formatSize(entry.size) : '' }}
                        </span>
                        <span class="text-xs text-gray-400 shrink-0 w-32 text-right">
                          {{ (entry.commit?.created_at || entry.last_commit?.created_at) ? relativeDate(entry.commit?.created_at || entry.last_commit?.created_at || '') : '' }}
                        </span>
                      </div>
                    </div>
                  </template>

                  <!-- Empty state -->
                  <div v-else class="flex flex-col items-center justify-center py-16 text-gray-400">
                    <el-icon class="text-5xl mb-3"><FolderOpened /></el-icon>
                    <p class="text-base font-medium mb-1">{{ t('datasetHub.noFiles') }}</p>
                    <p class="text-sm">{{ t('datasetHub.noFilesHint') }}</p>
                  </div>
                </div>
              </el-tab-pane>

              <el-tab-pane :label="t('datasetHub.cloneInfo')" name="clone">
                <div class="p-4 space-y-4">
                  <div v-if="dataset.repository?.http_clone_url">
                    <p class="text-sm font-semibold text-gray-700 mb-1">{{ t('datasetHub.httpClone') }}</p>
                    <div class="flex items-center gap-2">
                      <el-input
                        :model-value="dataset.repository.http_clone_url"
                        readonly
                        class="font-mono text-sm"
                      />
                      <el-button @click="copyText(dataset.repository!.http_clone_url)">
                        <el-icon><CopyDocument /></el-icon>
                      </el-button>
                    </div>
                  </div>

                  <div v-if="dataset.repository?.ssh_clone_url">
                    <p class="text-sm font-semibold text-gray-700 mb-1">{{ t('datasetHub.sshClone') }}</p>
                    <div class="flex items-center gap-2">
                      <el-input
                        :model-value="dataset.repository.ssh_clone_url"
                        readonly
                        class="font-mono text-sm"
                      />
                      <el-button @click="copyText(dataset.repository!.ssh_clone_url)">
                        <el-icon><CopyDocument /></el-icon>
                      </el-button>
                    </div>
                  </div>

                  <el-empty
                    v-if="!dataset.repository?.http_clone_url && !dataset.repository?.ssh_clone_url"
                    description="No clone URLs available"
                    class="py-8"
                  />
                </div>
              </el-tab-pane>
            </el-tabs>
          </div>
        </template>

      </div>
    </section>

    <!-- Upload Dialog -->
    <el-dialog
      v-model="showUploadDialog"
      :title="t('datasetHub.uploadTitle')"
      width="480px"
      :close-on-click-modal="false"
      @closed="resetUpload"
    >
      <!-- Drop zone -->
      <div
        class="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors mb-4"
        :class="{ 'border-blue-500 bg-blue-50': isDragging }"
        @click="fileInput?.click()"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="onDrop"
      >
        <el-icon class="text-4xl text-gray-400 mb-2"><Upload /></el-icon>
        <p class="text-sm font-medium text-gray-600">{{ t('datasetHub.dropZoneHint') }}</p>
        <p class="text-xs text-gray-400 mt-1">{{ t('datasetHub.dropZoneLimit') }}</p>
        <input
          ref="fileInput"
          type="file"
          multiple
          class="hidden"
          @change="onFileChange"
        />
      </div>

      <!-- Selected files list -->
      <template v-if="selectedFiles.length > 0">
        <p class="text-sm font-medium text-gray-700 mb-2">{{ t('datasetHub.selectedFiles') }}:</p>
        <ul class="space-y-1 mb-4">
          <li
            v-for="(f, idx) in selectedFiles"
            :key="idx"
            class="flex items-center justify-between text-sm bg-gray-50 rounded px-3 py-1.5"
          >
            <span class="truncate text-gray-700">{{ f.name }} <span class="text-gray-400">({{ formatSize(f.size) }})</span></span>
            <el-button link type="danger" size="small" @click="removeFile(idx)">
              <el-icon><Close /></el-icon>
            </el-button>
          </li>
        </ul>
      </template>

      <!-- Commit message -->
      <div class="mb-4">
        <p class="text-sm font-medium text-gray-700 mb-1">{{ t('datasetHub.commitMessage') }}:</p>
        <el-input
          v-model="commitMsg"
          :placeholder="t('datasetHub.commitMessagePlaceholder')"
        />
      </div>

      <template #footer>
        <el-button @click="showUploadDialog = false">{{ t('common.cancel') }}</el-button>
        <el-button
          type="primary"
          :loading="uploading"
          :disabled="selectedFiles.length === 0"
          @click="handleUpload"
        >
          {{ uploading ? t('datasetHub.uploading') : t('datasetHub.uploadFiles') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowLeft,
  Loading,
  Star,
  Download,
  Delete,
  CopyDocument,
  Upload,
  Close,
  FolderOpened,
  Opportunity as BranchIcon,
} from '@element-plus/icons-vue'
import TopNav from '../components/TopNav.vue'
import { getDataset, deleteDataset, getDatasetTree, commitFiles } from '../api/datasets'
import type { Dataset, FileEntry } from '../api/datasets'
import { useAuthStore } from '../stores/auth'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const namespace = route.params.namespace as string
const name = route.params.name as string

const dataset = ref<Dataset | null>(null)
const loading = ref(false)
const deleting = ref(false)
const activeTab = ref('readme')

// Files tab state
const fileList = ref<FileEntry[]>([])
const filesLoading = ref(false)
const currentBranch = ref('main')
const filesFetched = ref(false)

// Upload dialog state
const showUploadDialog = ref(false)
const selectedFiles = ref<File[]>([])
const commitMsg = ref('')
const uploading = ref(false)
const isDragging = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

const isOwner = computed(() => auth.isLoggedIn && auth.username === namespace)

const avatarChar = computed(() =>
  (dataset.value?.nickname || dataset.value?.name || '?').charAt(0).toUpperCase()
)

async function fetchDataset() {
  loading.value = true
  try {
    const res = await getDataset(namespace, name)
    dataset.value = res.data?.data ?? null
    if (dataset.value?.default_branch) {
      currentBranch.value = dataset.value.default_branch
    }
  } catch {
    dataset.value = null
  } finally {
    loading.value = false
  }
}

async function fetchFileTree() {
  if (filesLoading.value) return
  filesLoading.value = true
  try {
    const res = await getDatasetTree(namespace, name, currentBranch.value)
    fileList.value = res.data?.data ?? []
    filesFetched.value = true
  } catch {
    fileList.value = []
  } finally {
    filesLoading.value = false
  }
}

function onTabChange(tab: string) {
  if (tab === 'files' && !filesFetched.value) {
    fetchFileTree()
  }
}

async function handleDelete() {
  try {
    await ElMessageBox.confirm(
      t('datasetHub.deleteConfirm'),
      t('common.deleteConfirm'),
      { type: 'warning', confirmButtonText: t('common.delete'), cancelButtonText: 'Cancel' }
    )
  } catch {
    return
  }

  deleting.value = true
  try {
    await deleteDataset(namespace, name)
    ElMessage.success(t('datasetHub.deleteSuccess'))
    router.push('/datasets')
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.msg || 'Delete failed')
  } finally {
    deleting.value = false
  }
}

function copyText(text: string) {
  navigator.clipboard.writeText(text).then(() => {
    ElMessage.success(t('apikeys.copySuccess'))
  })
}

// File upload helpers
function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files) return
  addFiles(Array.from(input.files))
  input.value = ''
}

function onDrop(e: DragEvent) {
  isDragging.value = false
  if (!e.dataTransfer?.files) return
  addFiles(Array.from(e.dataTransfer.files))
}

function addFiles(files: File[]) {
  const combined = [...selectedFiles.value, ...files]
  // max 5 files
  selectedFiles.value = combined.slice(0, 5)
}

function removeFile(idx: number) {
  selectedFiles.value.splice(idx, 1)
}

function resetUpload() {
  selectedFiles.value = []
  commitMsg.value = ''
  isDragging.value = false
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // Strip the data URL prefix (data:...;base64,)
      const base64 = result.substring(result.indexOf(',') + 1)
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function handleUpload() {
  if (selectedFiles.value.length === 0) return
  uploading.value = true
  try {
    const files = await Promise.all(
      selectedFiles.value.map(async (f) => ({
        path: f.name,
        action: 'create' as const,
        content: await fileToBase64(f),
      }))
    )
    await commitFiles(namespace, name, currentBranch.value, {
      message: commitMsg.value || t('datasetHub.commitMessagePlaceholder'),
      files,
    })
    ElMessage.success(t('datasetHub.uploadSuccess'))
    showUploadDialog.value = false
    // Reload file tree
    filesFetched.value = false
    await fetchFileTree()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.msg || t('datasetHub.uploadError'))
  } finally {
    uploading.value = false
  }
}

// Formatting helpers
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`
}

function relativeDate(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}

onMounted(fetchDataset)
</script>
