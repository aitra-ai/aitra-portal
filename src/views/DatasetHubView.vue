<template>
  <div class="min-h-screen bg-gray-50">
    <TopNav />

    <section class="py-6 px-6">
      <div class="max-w-7xl mx-auto">
        <div class="mb-5 flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">{{ t('datasetHub.title') }}</h1>
            <p class="text-gray-500 text-sm mt-1">{{ t('datasetHub.subtitle') }}</p>
          </div>
          <el-button
            v-if="auth.isLoggedIn"
            type="primary"
            @click="showCreateDialog = true"
          >
            <el-icon class="mr-1"><Plus /></el-icon>
            {{ t('datasetHub.newDataset') }}
          </el-button>
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
          v-else-if="datasets.length === 0"
          :description="searchQuery ? t('modelHub.noResults') : t('modelHub.empty')"
          class="py-24"
        >
          <el-button v-if="searchQuery" @click="clearSearch">{{ t('modelHub.clearSearch') }}</el-button>
        </el-empty>

        <div v-else-if="viewMode === 'grid'" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <RepoCard
            v-for="ds in datasets"
            :key="ds.path"
            :item="ds"
            type="dataset"
            layout="grid"
          />
        </div>

        <div v-else class="space-y-2">
          <RepoCard
            v-for="ds in datasets"
            :key="ds.path"
            :item="ds"
            type="dataset"
            layout="list"
          />
        </div>

        <div v-if="total > perPage" class="flex justify-center mt-8">
          <el-pagination
            v-model:current-page="page"
            :page-size="perPage"
            :total="total"
            layout="prev, pager, next"
            @current-change="fetchDatasets"
          />
        </div>
      </div>
    </section>

    <!-- Create Dataset Dialog -->
    <el-dialog
      v-model="showCreateDialog"
      :title="t('datasetHub.createTitle')"
      width="480px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="createFormRef"
        :model="createForm"
        :rules="createRules"
        label-position="top"
      >
        <el-form-item :label="t('datasetHub.datasetName')" prop="name">
          <el-input
            v-model="createForm.name"
            :placeholder="t('datasetHub.datasetNamePlaceholder')"
          />
        </el-form-item>

        <el-form-item :label="t('datasetHub.nickname')" prop="nickname">
          <el-input
            v-model="createForm.nickname"
            :placeholder="t('datasetHub.nicknamePlaceholder')"
          />
        </el-form-item>

        <el-form-item :label="t('datasetHub.description')" prop="description">
          <el-input
            v-model="createForm.description"
            type="textarea"
            :rows="3"
            :placeholder="t('datasetHub.descriptionPlaceholder')"
          />
        </el-form-item>

        <el-form-item :label="t('datasetHub.visibility')" prop="private">
          <el-radio-group v-model="createForm.private">
            <el-radio :value="false">{{ t('datasetHub.visibilityPublic') }}</el-radio>
            <el-radio :value="true">{{ t('datasetHub.visibilityPrivate') }}</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item :label="t('datasetHub.license')" prop="license">
          <el-select v-model="createForm.license" clearable class="w-full">
            <el-option value="apache-2.0" label="Apache 2.0" />
            <el-option value="mit" label="MIT" />
            <el-option value="cc-by-4.0" label="CC BY 4.0" />
            <el-option value="cc0-1.0" label="CC0 1.0" />
            <el-option value="other" label="Other" />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showCreateDialog = false">{{ t('common.cancel') ?? 'Cancel' }}</el-button>
        <el-button type="primary" :loading="creating" @click="handleCreate">
          {{ t('common.save') ?? 'Create' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { Plus, Loading } from '@element-plus/icons-vue'
import TopNav from '../components/TopNav.vue'
import RepoCard from '../components/RepoCard.vue'
import HubToolbar from '../components/HubToolbar.vue'
import { listDatasets, createDataset } from '../api/datasets'
import type { Dataset } from '../api/datasets'
import { useAuthStore } from '../stores/auth'

const { t } = useI18n()
const router = useRouter()
const auth = useAuthStore()

const datasets = ref<Dataset[]>([])
const loading = ref(false)
const searchQuery = ref('')
const sortBy = ref('recently_update')
const viewMode = ref<'grid' | 'list'>('grid')
const page = ref(1)
const total = ref(0)
const perPage = 24

// Create dialog
const showCreateDialog = ref(false)
const creating = ref(false)
const createFormRef = ref<FormInstance>()

const createForm = reactive({
  name: '',
  nickname: '',
  description: '',
  private: false,
  license: '',
})

const createRules: FormRules = {
  name: [
    { required: true, message: t('datasetHub.datasetName'), trigger: 'blur' },
    {
      pattern: /^[a-z0-9-]+$/,
      message: t('datasetHub.datasetNameRule'),
      trigger: 'blur',
    },
  ],
}

let searchTimer: ReturnType<typeof setTimeout>

function onSearchChange(val: string) {
  searchQuery.value = val
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { page.value = 1; fetchDatasets() }, 400)
}

function onSortChange(val: string) {
  sortBy.value = val
  page.value = 1
  fetchDatasets()
}

function clearSearch() {
  searchQuery.value = ''
  page.value = 1
  fetchDatasets()
}

async function fetchDatasets() {
  loading.value = true
  try {
    const res = await listDatasets({
      per: perPage,
      page: page.value,
      sort: sortBy.value,
      ...(searchQuery.value ? { search: searchQuery.value } : {}),
    })
    datasets.value = res.data?.data ?? []
    total.value = res.data?.total ?? datasets.value.length
  } catch {
    datasets.value = []
  } finally {
    loading.value = false
  }
}

async function handleCreate() {
  if (!createFormRef.value) return
  const valid = await createFormRef.value.validate().catch(() => false)
  if (!valid) return

  creating.value = true
  try {
    const res = await createDataset({
      namespace: auth.username,
      name: createForm.name,
      nickname: createForm.nickname || undefined,
      description: createForm.description || undefined,
      private: createForm.private,
      license: createForm.license || undefined,
    })
    ElMessage.success(t('datasetHub.createSuccess'))
    showCreateDialog.value = false
    const created = res.data?.data
    if (created) {
      router.push(`/datasets/${auth.username}/${createForm.name}`)
    }
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.msg || 'Create failed')
  } finally {
    creating.value = false
  }
}

onMounted(fetchDatasets)
</script>
