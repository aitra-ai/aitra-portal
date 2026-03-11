<template>
  <div class="p-6 max-w-6xl mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">{{ t('admin.services.title') }}</h1>
        <p class="text-gray-500 mt-1 text-sm">{{ t('admin.services.subtitle') }}</p>
      </div>
      <el-button type="primary" :icon="Plus" @click="showAddDialog = true">
        {{ t('admin.services.add') }}
      </el-button>
    </div>

    <!-- Info banner -->
    <el-alert
      :title="t('admin.services.infoBanner')"
      type="info"
      :closable="false"
      class="mb-6"
      show-icon
    />

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-20">
      <el-icon class="animate-spin text-blue-500 text-3xl"><Loading /></el-icon>
    </div>

    <!-- Empty -->
    <el-empty v-else-if="services.length === 0" :description="t('admin.services.noServices')" class="py-20">
      <el-button type="primary" @click="showAddDialog = true">{{ t('admin.services.add') }}</el-button>
    </el-empty>

    <!-- Service cards -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <div
        v-for="svc in services"
        :key="svc.id"
        class="bg-white rounded-xl border border-gray-200 p-5 shadow-sm"
      >
        <div class="flex items-start justify-between mb-3">
          <div class="flex-1 min-w-0 mr-2">
            <div class="flex items-center gap-2 mb-1">
              <div class="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                <el-icon class="text-blue-500 text-sm"><Cpu /></el-icon>
              </div>
              <h3 class="font-semibold text-gray-900 truncate text-sm">{{ svc.deploy_name || svc.model_id }}</h3>
            </div>
            <p class="text-xs text-gray-400 truncate pl-9">{{ svc.model_id || svc.repo_path }}</p>
          </div>
          <el-tag :type="statusInfo(svc.status).type" size="small" class="shrink-0">
            {{ t(statusInfo(svc.status).label) }}
          </el-tag>
        </div>

        <!-- Endpoint -->
        <div v-if="svc.endpoint" class="mb-3 p-2 bg-gray-50 rounded-lg flex items-center gap-2">
          <el-icon class="text-gray-400 text-xs shrink-0"><Link /></el-icon>
          <span class="text-xs text-gray-600 truncate flex-1">{{ svc.endpoint }}</span>
          <el-button text size="small" :icon="CopyDocument" @click="copyText(svc.endpoint)" />
        </div>

        <!-- Meta -->
        <div class="flex items-center gap-3 text-xs text-gray-400 mb-4">
          <span>{{ t('deployments.replicas') }}: {{ svc.min_replica }}–{{ svc.max_replica }}</span>
        </div>

        <!-- Actions -->
        <div class="flex gap-2">
          <el-button
            v-if="svc.status === 2 || svc.status === 3"
            size="small" type="success" plain
            :loading="actionLoading[svc.id] === 'start'"
            @click="handleStart(svc)"
          >{{ t('deployments.start') }}</el-button>

          <el-button
            v-if="svc.status === 1"
            size="small" type="warning" plain
            :loading="actionLoading[svc.id] === 'stop'"
            @click="handleStop(svc)"
          >{{ t('deployments.stop') }}</el-button>
        </div>
      </div>
    </div>

    <!-- Add Service Dialog -->
    <el-dialog
      v-model="showAddDialog"
      :title="t('admin.services.add')"
      width="500px"
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
            @select="onModelSelect"
          >
            <template #default="{ item }">
              <div class="text-sm">{{ item.path }}</div>
            </template>
          </el-autocomplete>
        </el-form-item>

        <!-- Service name -->
        <el-form-item :label="t('admin.services.name')" prop="deploy_name">
          <el-input v-model="form.deploy_name" :placeholder="t('admin.services.namePlaceholder')" />
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
          </el-form-item>
          <el-form-item :label="t('deployments.maxReplica')" prop="max_replica" class="flex-1">
            <el-select v-model="form.max_replica" class="w-full">
              <el-option v-for="n in [1,2,3,4,5]" :key="n" :label="n" :value="n" />
            </el-select>
          </el-form-item>
        </div>

        <el-alert v-if="addError" :title="addError" type="error" :closable="false" show-icon />
      </el-form>

      <template #footer>
        <el-button @click="showAddDialog = false">{{ t('apikeys.cancel') }}</el-button>
        <el-button type="primary" :loading="adding" @click="handleAdd">
          {{ t('admin.services.confirm') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Plus, Link, CopyDocument } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import {
  getRuntimeFrameworks, searchModels, createServerlessService,
  stopServerless, startServerless,
  DEPLOY_STATUS, type Deployment, type RuntimeFramework
} from '../api/deployments'
import api from '../api/index'

const { t } = useI18n()

const loading = ref(false)
const services = ref<Deployment[]>([])
const frameworks = ref<RuntimeFramework[]>([])
const loadingFrameworks = ref(false)
const showAddDialog = ref(false)
const adding = ref(false)
const addError = ref('')
const actionLoading = ref<Record<number, string>>({})
const formRef = ref()

const form = reactive({
  model_id: '',
  deploy_name: '',
  runtime_framework_id: null as number | null,
  min_replica: 1,
  max_replica: 2,
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

function copyText(text: string) {
  navigator.clipboard.writeText(text)
  ElMessage.success(t('apikeys.copySuccess'))
}

onMounted(async () => {
  await fetchServices()
  await fetchFrameworks()
})

async function fetchServices() {
  loading.value = true
  try {
    // List all cluster deploys (admin view)
    const res = await api.get<{ data: Deployment[] }>('/cluster/deploys?deploy_type=2')
    services.value = res.data?.data ?? []
  } catch {
    services.value = []
  } finally {
    loading.value = false
  }
}

async function fetchFrameworks() {
  loadingFrameworks.value = true
  try {
    const res = await getRuntimeFrameworks(2)  // serverless type
    frameworks.value = res.data?.data ?? []
    if (!frameworks.value.length) {
      const res2 = await getRuntimeFrameworks(1)
      frameworks.value = res2.data?.data ?? []
    }
  } catch {
    //
  } finally {
    loadingFrameworks.value = false
  }
}

async function fetchModelSuggestions(query: string, cb: Function) {
  if (!query) return cb([])
  try {
    const res = await searchModels(query)
    const list = (res.data?.data ?? []).map((m: any) => ({
      path: m.path || m.name,
      value: m.path || m.name,
    }))
    cb(list)
  } catch {
    cb([])
  }
}

function onModelSelect(item: { path: string }) {
  const parts = item.path.split('/')
  form._namespace = parts[0] ?? ''
  form._name = parts[1] ?? parts[0]
  if (!form.deploy_name) form.deploy_name = form._name
}

async function handleAdd() {
  await formRef.value?.validate(async (valid: boolean) => {
    if (!valid) return
    const ns = form._namespace || form.model_id.split('/')[0]
    const name = form._name || form.model_id.split('/')[1] || form.model_id
    adding.value = true
    addError.value = ''
    try {
      await createServerlessService(ns, name, {
        deploy_name: form.deploy_name,
        runtime_framework_id: form.runtime_framework_id!,
        min_replica: form.min_replica,
        max_replica: form.max_replica,
      })
      ElMessage.success(t('admin.services.addSuccess'))
      showAddDialog.value = false
      Object.assign(form, { model_id: '', deploy_name: '', runtime_framework_id: null, _namespace: '', _name: '' })
      await fetchServices()
    } catch (e: any) {
      addError.value = e?.response?.data?.msg || t('common.error')
    } finally {
      adding.value = false
    }
  })
}

function getNamespaceName(svc: Deployment) {
  const path = svc.repo_path || svc.model_id || ''
  const parts = path.split('/')
  return { ns: parts[0] ?? '', name: parts[1] ?? parts[0] }
}

async function handleStart(svc: Deployment) {
  const { ns, name } = getNamespaceName(svc)
  actionLoading.value[svc.id] = 'start'
  try {
    await startServerless(ns, name, svc.id)
    ElMessage.success(t('deployments.startSuccess'))
    await fetchServices()
  } catch { ElMessage.error(t('common.error')) }
  finally { delete actionLoading.value[svc.id] }
}

async function handleStop(svc: Deployment) {
  const { ns, name } = getNamespaceName(svc)
  actionLoading.value[svc.id] = 'stop'
  try {
    await stopServerless(ns, name, svc.id)
    ElMessage.success(t('deployments.stopSuccess'))
    await fetchServices()
  } catch { ElMessage.error(t('common.error')) }
  finally { delete actionLoading.value[svc.id] }
}
</script>
