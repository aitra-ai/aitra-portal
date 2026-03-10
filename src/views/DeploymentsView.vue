<template>
  <div class="p-6 max-w-6xl mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">{{ t('deployments.title') }}</h1>
        <p class="text-gray-500 mt-1 text-sm">{{ t('deployments.subtitle') }}</p>
      </div>
      <el-button type="primary" :icon="Plus" @click="showCreateDialog = true">
        {{ t('deployments.new') }}
      </el-button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-20">
      <el-icon class="animate-spin text-blue-500 text-3xl"><Loading /></el-icon>
    </div>

    <!-- Empty -->
    <el-empty v-else-if="deployments.length === 0" :description="t('deployments.noDeployments')" class="py-20">
      <el-button type="primary" @click="showCreateDialog = true">{{ t('deployments.new') }}</el-button>
    </el-empty>

    <!-- Deployment cards -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <div
        v-for="deploy in deployments"
        :key="deploy.id"
        class="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow"
      >
        <!-- Model name + status -->
        <div class="flex items-start justify-between mb-3">
          <div class="flex-1 min-w-0 mr-2">
            <h3 class="font-semibold text-gray-900 truncate text-sm">{{ deploy.deploy_name }}</h3>
            <p class="text-xs text-gray-400 truncate mt-0.5">{{ deploy.model_id || deploy.repo_path }}</p>
          </div>
          <el-tag :type="statusInfo(deploy.status).type" size="small" class="shrink-0">
            {{ t(statusInfo(deploy.status).label) }}
          </el-tag>
        </div>

        <!-- Endpoint -->
        <div v-if="deploy.endpoint" class="mb-3 p-2 bg-gray-50 rounded-lg flex items-center gap-2">
          <el-icon class="text-gray-400 text-xs shrink-0"><Link /></el-icon>
          <span class="text-xs text-gray-600 truncate flex-1">{{ deploy.endpoint }}</span>
          <el-button text size="small" :icon="CopyDocument" @click="copyEndpoint(deploy.endpoint)" />
        </div>

        <!-- Meta -->
        <div class="flex items-center gap-3 text-xs text-gray-400 mb-4">
          <span>{{ t('deployments.replicas') }}: {{ deploy.min_replica }}–{{ deploy.max_replica }}</span>
          <span>{{ formatDate(deploy.created_at) }}</span>
        </div>

        <!-- Actions -->
        <div class="flex gap-2">
          <el-button
            v-if="deploy.status === 2 || deploy.status === 3"
            size="small" type="success" plain
            :loading="actionLoading[deploy.id] === 'start'"
            @click="handleStart(deploy)"
          >{{ t('deployments.start') }}</el-button>

          <el-button
            v-if="deploy.status === 1"
            size="small" type="warning" plain
            :loading="actionLoading[deploy.id] === 'stop'"
            @click="handleStop(deploy)"
          >{{ t('deployments.stop') }}</el-button>

          <el-button
            size="small" type="danger" plain
            :loading="actionLoading[deploy.id] === 'delete'"
            @click="handleDelete(deploy)"
          >{{ t('deployments.delete') }}</el-button>
        </div>
      </div>
    </div>

    <!-- Create Dialog -->
    <el-dialog
      v-model="showCreateDialog"
      :title="t('deployments.new')"
      width="520px"
      :close-on-click-modal="false"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-position="top" class="space-y-1">
        <!-- Model search -->
        <el-form-item :label="t('deployments.modelId')" prop="model_id">
          <el-autocomplete
            v-model="form.model_id"
            :fetch-suggestions="fetchModelSuggestions"
            :placeholder="t('deployments.modelIdPlaceholder')"
            class="w-full"
            value-key="path"
            @select="onModelSelect"
          >
            <template #default="{ item }">
              <div class="text-sm font-medium">{{ item.path }}</div>
            </template>
          </el-autocomplete>
        </el-form-item>

        <!-- Deploy name -->
        <el-form-item :label="t('deployments.deployName')" prop="deploy_name">
          <el-input v-model="form.deploy_name" :placeholder="t('deployments.deployNamePlaceholder')" />
        </el-form-item>

        <!-- Runtime framework -->
        <el-form-item :label="t('deployments.runtimeFramework')" prop="runtime_framework_id">
          <el-select v-model="form.runtime_framework_id" class="w-full" :loading="loadingFrameworks">
            <el-option
              v-for="fw in frameworks"
              :key="fw.id"
              :label="`${fw.frame_name} ${fw.frame_version}`"
              :value="fw.id"
            />
          </el-select>
        </el-form-item>

        <!-- Replicas -->
        <div class="flex gap-4">
          <el-form-item :label="t('deployments.minReplica')" prop="min_replica" class="flex-1">
            <el-select v-model="form.min_replica" class="w-full">
              <el-option v-for="n in [0,1,2,3]" :key="n" :label="n" :value="n" />
            </el-select>
            <p v-if="form.min_replica === 0" class="text-xs text-gray-400 mt-1">{{ t('deployments.autoSleepTip') }}</p>
          </el-form-item>
          <el-form-item :label="t('deployments.maxReplica')" prop="max_replica" class="flex-1">
            <el-select v-model="form.max_replica" class="w-full">
              <el-option v-for="n in [1,2,3,4,5]" :key="n" :label="n" :value="n" />
            </el-select>
          </el-form-item>
        </div>

        <el-alert v-if="createError" :title="createError" type="error" :closable="false" show-icon />
      </el-form>

      <template #footer>
        <el-button @click="showCreateDialog = false">{{ t('apikeys.cancel') }}</el-button>
        <el-button type="primary" :loading="creating" @click="handleCreate">
          {{ t('deployments.create') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Plus, Link, CopyDocument } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '../stores/auth'
import {
  getUserDeployments, createDeployment, startDeployment, stopDeployment,
  deleteDeployment, getRuntimeFrameworks, searchModels,
  DEPLOY_STATUS, type Deployment, type RuntimeFramework
} from '../api/deployments'

const { t } = useI18n()
const auth = useAuthStore()

const loading = ref(false)
const deployments = ref<Deployment[]>([])
const frameworks = ref<RuntimeFramework[]>([])
const loadingFrameworks = ref(false)
const showCreateDialog = ref(false)
const creating = ref(false)
const createError = ref('')
const actionLoading = ref<Record<number, string>>({})
const formRef = ref()

const form = reactive({
  model_id: '',
  deploy_name: '',
  runtime_framework_id: null as number | null,
  min_replica: 0,
  max_replica: 1,
  _namespace: '',
  _name: '',
})

const rules = {
  model_id: [{ required: true, message: ' ', trigger: 'blur' }],
  deploy_name: [{ required: true, message: ' ', trigger: 'blur' }],
  runtime_framework_id: [{ required: true, message: ' ', trigger: 'change' }],
}

function statusInfo(status: number) {
  return DEPLOY_STATUS[status] ?? { label: 'deployments.status.pending', type: 'info' as const }
}

function formatDate(s: string) {
  if (!s || s.startsWith('0001')) return ''
  return new Date(s).toLocaleDateString('zh-CN')
}

function copyEndpoint(url: string) {
  navigator.clipboard.writeText(url)
  ElMessage.success(t('apikeys.copySuccess'))
}

onMounted(async () => {
  await fetchDeployments()
  await fetchFrameworks()
})

async function fetchDeployments() {
  if (!auth.username) return
  loading.value = true
  try {
    const res = await getUserDeployments(auth.username)
    deployments.value = res.data?.data ?? []
  } catch {
    ElMessage.error(t('common.error'))
  } finally {
    loading.value = false
  }
}

async function fetchFrameworks() {
  loadingFrameworks.value = true
  try {
    const res = await getRuntimeFrameworks(1)
    frameworks.value = res.data?.data ?? []
  } catch {
    // not critical
  } finally {
    loadingFrameworks.value = false
  }
}

async function fetchModelSuggestions(query: string, cb: Function) {
  if (!query) return cb([])
  try {
    const res = await searchModels(query)
    const list = (res.data?.data ?? []).map((m: any) => ({ path: m.path || m.name, value: m.path || m.name }))
    cb(list)
  } catch {
    cb([])
  }
}

function onModelSelect(item: { path: string }) {
  const parts = item.path.split('/')
  form._namespace = parts[0] ?? ''
  form._name = parts[1] ?? parts[0]
  if (!form.deploy_name) {
    form.deploy_name = form._name
  }
}

async function handleCreate() {
  await formRef.value?.validate(async (valid: boolean) => {
    if (!valid) return
    const ns = form._namespace || form.model_id.split('/')[0]
    const name = form._name || form.model_id.split('/')[1] || form.model_id
    if (!ns || !name) {
      createError.value = '请选择有效的模型'
      return
    }
    creating.value = true
    createError.value = ''
    try {
      await createDeployment(ns, name, {
        deploy_name: form.deploy_name,
        runtime_framework_id: form.runtime_framework_id!,
        min_replica: form.min_replica,
        max_replica: form.max_replica,
      })
      ElMessage.success(t('deployments.createSuccess'))
      showCreateDialog.value = false
      Object.assign(form, { model_id: '', deploy_name: '', runtime_framework_id: null, min_replica: 0, max_replica: 1, _namespace: '', _name: '' })
      await fetchDeployments()
    } catch (e: any) {
      createError.value = e?.response?.data?.msg || t('common.error')
    } finally {
      creating.value = false
    }
  })
}

function getNamespaceName(deploy: Deployment) {
  const path = deploy.repo_path || deploy.model_id || ''
  const parts = path.split('/')
  return { ns: parts[0] ?? '', name: parts[1] ?? parts[0] }
}

async function handleStart(deploy: Deployment) {
  const { ns, name } = getNamespaceName(deploy)
  actionLoading.value[deploy.id] = 'start'
  try {
    await startDeployment(ns, name, deploy.id)
    ElMessage.success(t('deployments.startSuccess'))
    await fetchDeployments()
  } catch {
    ElMessage.error(t('common.error'))
  } finally {
    delete actionLoading.value[deploy.id]
  }
}

async function handleStop(deploy: Deployment) {
  const { ns, name } = getNamespaceName(deploy)
  actionLoading.value[deploy.id] = 'stop'
  try {
    await stopDeployment(ns, name, deploy.id)
    ElMessage.success(t('deployments.stopSuccess'))
    await fetchDeployments()
  } catch {
    ElMessage.error(t('common.error'))
  } finally {
    delete actionLoading.value[deploy.id]
  }
}

async function handleDelete(deploy: Deployment) {
  await ElMessageBox.confirm(t('deployments.deleteConfirm'), t('deployments.delete'), {
    type: 'warning',
    confirmButtonText: t('apikeys.confirm'),
    cancelButtonText: t('apikeys.cancel'),
  })
  const { ns, name } = getNamespaceName(deploy)
  actionLoading.value[deploy.id] = 'delete'
  try {
    await deleteDeployment(ns, name, deploy.id)
    ElMessage.success(t('deployments.deleteSuccess'))
    await fetchDeployments()
  } catch {
    ElMessage.error(t('common.error'))
  } finally {
    delete actionLoading.value[deploy.id]
  }
}
</script>
