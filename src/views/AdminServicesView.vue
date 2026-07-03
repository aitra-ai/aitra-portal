<template>
  <div class="p-6 max-w-6xl mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">{{ t('admin.services.title') }}</h1>
        <p class="text-gray-500 mt-1 text-sm">{{ t('admin.services.subtitle') }}</p>
      </div>
      <el-button type="primary" :icon="Plus" @click="openAddDialog">
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
      <el-button type="primary" @click="openAddDialog">{{ t('admin.services.add') }}</el-button>
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

    <!-- ==================== Add Service Dialog (redesigned) ==================== -->
    <el-dialog
      v-model="showAddDialog"
      :title="t('admin.services.add')"
      width="740px"
      :close-on-click-modal="false"
      top="5vh"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-position="top">

        <!-- ── Section 1: Model ── -->
        <div class="mb-5">
          <div class="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span class="w-5 h-5 bg-blue-500 text-white rounded-full text-xs flex items-center justify-center">1</span>
            {{ t('admin.services.sectionModel') }}
          </div>

          <!-- Model source toggle -->
          <el-radio-group v-model="modelSource" class="mb-3" size="small">
            <el-radio-button value="platform">{{ t('admin.services.platformModel') }}</el-radio-button>
            <el-radio-button value="huggingface">HuggingFace</el-radio-button>
          </el-radio-group>

          <!-- Platform model search -->
          <el-form-item v-if="modelSource === 'platform'" :label="t('deployments.modelId')" prop="model_id">
            <el-autocomplete
              v-model="form.model_id"
              :fetch-suggestions="fetchModelSuggestions"
              :placeholder="t('admin.services.modelSearchPlaceholder')"
              class="w-full"
              @select="onModelSelect"
            >
              <template #default="{ item }">
                <div class="text-sm">{{ item.path }}</div>
              </template>
            </el-autocomplete>
          </el-form-item>

          <!-- HuggingFace model ID -->
          <el-form-item v-else :label="t('admin.services.hfModelId')" prop="model_id">
            <el-input
              v-model="form.model_id"
              placeholder="meta-llama/Llama-3.1-8B-Instruct"
              @change="onHfModelChange"
            >
              <template #prefix>
                <span class="text-gray-400 text-xs">🤗</span>
              </template>
            </el-input>
            <div class="text-xs text-gray-400 mt-1">{{ t('admin.services.hfModelHint') }}</div>
          </el-form-item>
        </div>

        <!-- ── Section 2: Deployment Config ── -->
        <div class="mb-5">
          <div class="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span class="w-5 h-5 bg-blue-500 text-white rounded-full text-xs flex items-center justify-center">2</span>
            {{ t('admin.services.sectionConfig') }}
          </div>

          <div class="grid grid-cols-2 gap-4">
            <!-- Service name -->
            <el-form-item :label="t('admin.services.name')" prop="deploy_name">
              <el-input v-model="form.deploy_name" :placeholder="t('admin.services.namePlaceholder')" />
            </el-form-item>

            <!-- Runtime framework -->
            <el-form-item :label="t('admin.services.framework')" prop="runtime_framework_id">
              <el-select
                v-model="form.runtime_framework_id"
                class="w-full"
                :loading="loadingFrameworks"
                :placeholder="t('admin.services.frameworkPlaceholder')"
                filterable
              >
                <el-option-group :label="t('admin.services.popularFrameworks')">
                  <el-option
                    v-for="fw in popularFrameworks"
                    :key="fw.id"
                    :label="`${fw.frame_name} ${fw.frame_version}`"
                    :value="fw.id"
                  />
                </el-option-group>
                <el-option-group :label="t('admin.services.otherFrameworks')">
                  <el-option
                    v-for="fw in otherFrameworks"
                    :key="fw.id"
                    :label="`${fw.frame_name} ${fw.frame_version}`"
                    :value="fw.id"
                  />
                </el-option-group>
              </el-select>
            </el-form-item>
          </div>

          <!-- GPU SKU Selection -->
          <el-form-item :label="t('admin.services.selectGpu')" prop="sku_name">
            <div v-if="loadingSkus" class="text-center py-4">
              <el-icon class="animate-spin text-blue-400"><Loading /></el-icon>
            </div>
            <div v-else class="grid grid-cols-2 lg:grid-cols-3 gap-3">
              <div
                v-for="sku in gpuSkus"
                :key="sku.name"
                :class="[
                  'p-3 rounded-lg border-2 cursor-pointer transition-all text-sm',
                  form.sku_name === sku.name
                    ? 'border-blue-500 bg-blue-50 shadow-sm'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                ]"
                @click="selectSku(sku)"
              >
                <div class="font-semibold text-gray-800 text-xs mb-1">{{ sku.display_name }}</div>
                <div class="text-xs text-gray-500 space-y-0.5">
                  <div v-if="sku.gpu_count > 0">{{ sku.gpu_model }}</div>
                  <div>{{ sku.gpu_count > 0 ? sku.gpu_count + ' GPU' : 'CPU only' }} · {{ sku.vcpus }} vCPU · {{ sku.memory_gb }}GB</div>
                </div>
                <div class="mt-2 text-xs font-semibold" :class="form.sku_name === sku.name ? 'text-blue-600' : 'text-emerald-600'">
                  ${{ sku.price_per_hour.toFixed(2) }}/hr
                </div>
              </div>
            </div>
          </el-form-item>

          <!-- Engine Args -->
          <el-form-item :label="t('admin.services.engineArgs')">
            <div class="flex gap-2 mb-2">
              <el-button size="small" @click="setPresetArgs('auto')">
                {{ t('admin.services.presetAuto') }}
              </el-button>
              <el-button size="small" @click="setPresetArgs('custom')">
                {{ t('admin.services.presetCustom') }}
              </el-button>
            </div>
            <el-input
              v-model="form.engine_args"
              type="textarea"
              :rows="2"
              :placeholder="t('admin.services.engineArgsPlaceholder')"
            />
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
        </div>

        <!-- ── Section 3: Cost Summary ── -->
        <div v-if="selectedSku" class="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl mb-4">
          <div class="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <span class="w-5 h-5 bg-blue-500 text-white rounded-full text-xs flex items-center justify-center">3</span>
            {{ t('admin.services.costSummary') }}
          </div>
          <div class="grid grid-cols-3 gap-4 text-center">
            <div>
              <div class="text-xs text-gray-500">{{ t('admin.services.costPerHour') }}</div>
              <div class="text-lg font-bold text-blue-600">${{ selectedSku.price_per_hour.toFixed(2) }}</div>
            </div>
            <div>
              <div class="text-xs text-gray-500">{{ t('admin.services.costPerDay') }}</div>
              <div class="text-lg font-bold text-orange-500">${{ (selectedSku.price_per_hour * 24).toFixed(2) }}</div>
            </div>
            <div>
              <div class="text-xs text-gray-500">{{ t('admin.services.costPerMonth') }}</div>
              <div class="text-lg font-bold text-red-500">${{ (selectedSku.price_per_hour * 24 * 30).toFixed(0) }}</div>
            </div>
          </div>
        </div>

        <el-alert v-if="addError" :title="addError" type="error" :closable="false" show-icon />
      </el-form>

      <template #footer>
        <el-button @click="showAddDialog = false">{{ t('apikeys.cancel') }}</el-button>
        <el-button type="primary" :loading="adding" @click="handleAdd" :disabled="!canSubmit">
          {{ t('admin.services.confirm') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Plus, Link, CopyDocument } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import {
  getRuntimeFrameworks, searchModels, createServerlessService,
  stopServerless, startServerless,
  DEPLOY_STATUS, type Deployment, type RuntimeFramework
} from '../api/deployments'
import { listPublicGPUSkus, type GPUSku } from '../api/gpu'
import api from '../api/index'

const { t } = useI18n()

// ── Service list state ──
const loading = ref(false)
const services = ref<Deployment[]>([])
const actionLoading = ref<Record<number, string>>({})

// ── Dialog state ──
const showAddDialog = ref(false)
const adding = ref(false)
const addError = ref('')
const formRef = ref()
const modelSource = ref<'platform' | 'huggingface'>('platform')

// ── Data for selects ──
const frameworks = ref<RuntimeFramework[]>([])
const loadingFrameworks = ref(false)
const gpuSkus = ref<GPUSku[]>([])
const loadingSkus = ref(false)

const POPULAR_NAMES = ['vllm', 'sglang', 'tgi', 'nvidia-vllm', 'nvidia-sglang']

const popularFrameworks = computed(() =>
  frameworks.value.filter(fw => POPULAR_NAMES.some(n => fw.frame_name.toLowerCase().includes(n)))
)
const otherFrameworks = computed(() =>
  frameworks.value.filter(fw => !POPULAR_NAMES.some(n => fw.frame_name.toLowerCase().includes(n)))
)

// Map GPU SKU name → space_resources.id
const skuResourceMap: Record<string, number> = {
  'cpu-8c-16g': 2,
  'nvidia-a100-80g-1x': 1,
  'nvidia-a100-80g-2x': 3,
  'nvidia-a100-80g-4x': 4,
  'nvidia-a100-80g-8x': 5,
  'nvidia-h100-80g-1x': 6,
  'nvidia-h100-80g-2x': 7,
  'nvidia-h100-80g-4x': 8,
  'nvidia-h100-80g-8x': 9,
}

const form = reactive({
  model_id: '',
  deploy_name: '',
  runtime_framework_id: null as number | null,
  sku_name: '',
  engine_args: '',
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

const selectedSku = computed(() =>
  gpuSkus.value.find(s => s.name === form.sku_name) ?? null
)

const canSubmit = computed(() =>
  form.model_id && form.deploy_name && form.runtime_framework_id && form.sku_name
)

// ── Methods ──

function statusInfo(status: number) {
  return DEPLOY_STATUS[status] ?? { label: 'deployments.status.pending', type: 'info' as const }
}

function copyText(text: string) {
  navigator.clipboard.writeText(text)
  ElMessage.success(t('apikeys.copySuccess'))
}

function openAddDialog() {
  Object.assign(form, {
    model_id: '', deploy_name: '', runtime_framework_id: null,
    sku_name: '', engine_args: '', min_replica: 1, max_replica: 2,
    _namespace: '', _name: '',
  })
  modelSource.value = 'platform'
  addError.value = ''
  showAddDialog.value = true
}

function selectSku(sku: GPUSku) {
  form.sku_name = sku.name
  // Auto-suggest engine args if GPU count > 1
  if (sku.gpu_count > 1 && !form.engine_args) {
    setPresetArgs('auto')
  }
}

function setPresetArgs(preset: string) {
  const gpuCount = selectedSku.value?.gpu_count ?? 1
  if (preset === 'auto') {
    // Backend parses as map[string]string — all values must be strings
    const args: Record<string, string> = { 'max-model-len': '4096' }
    if (gpuCount > 1) args['tensor-parallel-size'] = String(gpuCount)
    form.engine_args = JSON.stringify(args)
  } else {
    form.engine_args = ''
  }
}

function onHfModelChange() {
  const id = form.model_id
  if (id.includes('/')) {
    const parts = id.split('/')
    form._namespace = parts[0]
    form._name = parts[1]
    if (!form.deploy_name) {
      form.deploy_name = parts[1].toLowerCase().replace(/[^a-z0-9-]/g, '-').substring(0, 40)
    }
  }
}

// ── Data fetching ──

onMounted(async () => {
  await fetchServices()
  await Promise.all([fetchFrameworks(), fetchGpuSkus()])
})

async function fetchServices() {
  loading.value = true
  try {
    const res = await api.get<{ data: Deployment[] }>('/cluster/deploys')
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
    // type=1 is inference
    const res = await getRuntimeFrameworks(1)
    frameworks.value = res.data?.data ?? []
    // Auto-select latest vllm
    const latestVllm = frameworks.value.find(fw => fw.frame_name === 'vllm')
    if (latestVllm) form.runtime_framework_id = latestVllm.id
  } catch { /* */ }
  finally { loadingFrameworks.value = false }
}

async function fetchGpuSkus() {
  loadingSkus.value = true
  try {
    const res = await listPublicGPUSkus()
    gpuSkus.value = (res.data?.data ?? []).filter((s: GPUSku) => s.enabled)
  } catch { /* */ }
  finally { loadingSkus.value = false }
}

async function fetchModelSuggestions(query: string, cb: (list: Array<{ path: string; value: string }>) => void) {
  if (!query) return cb([])
  try {
    const res = await searchModels(query)
    const list = (res.data?.data ?? []).map((m: { path?: string; name?: string }) => ({
      path: m.path || m.name || '',
      value: m.path || m.name || '',
    }))
    cb(list)
  } catch {
    cb([])
  }
}

function onModelSelect(item: { path: string }) {
  const parts = item.path.split('/')
  form._namespace = parts[0] || ''
  form._name = parts[1] || parts[0] || ''
  if (!form.deploy_name) form.deploy_name = form._name
}

// ── Actions ──

async function handleAdd() {
  await formRef.value?.validate(async (valid: boolean) => {
    if (!valid) return
    const idParts = form.model_id.split('/')
    const ns = form._namespace || idParts[0] || ''
    const name = form._name || idParts[1] || form.model_id
    adding.value = true
    addError.value = ''
    try {
      await createServerlessService(ns, name, {
        deploy_name: form.deploy_name,
        runtime_framework_id: form.runtime_framework_id!,
        resource_id: skuResourceMap[form.sku_name] || 0,
        min_replica: form.min_replica,
        max_replica: form.max_replica,
        engine_args: form.engine_args,
        cluster_id: 'aitra-gpu-cluster',
      })
      ElMessage.success(t('admin.services.addSuccess'))
      showAddDialog.value = false
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
  return { ns: parts[0] || '', name: parts[1] || parts[0] || '' }
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
