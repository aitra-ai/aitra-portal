<template>
  <div class="p-6 max-w-6xl mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">{{ t('gpu.title') }}</h1>
        <p class="text-gray-500 mt-1 text-sm">{{ t('gpu.subtitle') }}</p>
      </div>
      <div class="flex items-center gap-4">
        <div v-if="!balanceLoading" class="text-sm text-gray-600">
          {{ t('gpu.balance') }}:
          <span :class="['font-mono font-semibold', balance <= 1 ? 'text-red-500' : 'text-emerald-600']">
            ${{ balance.toFixed(4) }}
          </span>
        </div>
        <div v-else class="text-sm text-gray-400">{{ t('common.loadingBalance') }}</div>
        <el-button type="primary" :icon="Plus" @click="openCreateDialog">
          {{ t('gpu.newDeploy') }}
        </el-button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-20">
      <el-icon class="animate-spin text-blue-500 text-3xl"><Loading /></el-icon>
    </div>

    <!-- Empty -->
    <el-empty v-else-if="deployments.length === 0" :description="t('gpu.noDeployments')" class="py-20">
      <el-button type="primary" @click="openCreateDialog">{{ t('gpu.newDeploy') }}</el-button>
    </el-empty>

    <!-- Deployment cards -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <div
        v-for="deploy in deployments"
        :key="deploy.id"
        class="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow"
      >
        <!-- Name + status -->
        <div class="flex items-start justify-between mb-3">
          <div class="flex-1 min-w-0 mr-2">
            <h3 class="font-semibold text-gray-900 truncate text-sm">{{ deploy.deploy_name }}</h3>
            <p class="text-xs text-gray-400 truncate mt-0.5">{{ deploy.model_path }}</p>
          </div>
          <el-tag
            :type="deploy.status === 'running' ? 'success' : 'info'"
            size="small"
            class="shrink-0"
          >
            <span class="flex items-center gap-1">
              <span :class="['w-1.5 h-1.5 rounded-full', deploy.status === 'running' ? 'bg-green-500' : 'bg-gray-400']" />
              {{ deploy.status === 'running' ? t('gpu.running') : t('gpu.stopped') }}
            </span>
          </el-tag>
        </div>

        <!-- SKU info -->
        <div class="mb-3 p-2 bg-gray-50 rounded-lg text-xs text-gray-600">
          <span class="font-medium">{{ deploy.sku_name }}</span>
        </div>

        <!-- Billing info -->
        <div class="space-y-1 mb-4 text-xs text-gray-500">
          <div class="flex justify-between">
            <span>{{ t('gpu.pricePerHr') }}</span>
            <span class="font-mono font-semibold text-gray-700">${{ deploy.price_per_hour.toFixed(2) }}/hr</span>
          </div>
          <div class="flex justify-between">
            <span>{{ t('gpu.totalBilled') }}</span>
            <span class="font-mono font-semibold text-gray-700">${{ deploy.total_billed_usd.toFixed(4) }}</span>
          </div>
          <div v-if="deploy.status === 'running'" class="flex justify-between">
            <span>{{ t('gpu.runningTime') }}</span>
            <span class="font-mono text-emerald-600">{{ formatRunningTime(deploy.running_hours) }}</span>
          </div>
          <div v-if="deploy.status === 'running'" class="flex justify-between">
            <span>{{ t('gpu.currentBill') }}</span>
            <span class="font-mono text-orange-500">${{ deploy.estimated_current_bill.toFixed(4) }}</span>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex gap-2">
          <el-button
            v-if="deploy.status === 'running'"
            size="small"
            type="warning"
            plain
            :loading="actionLoading[deploy.id] === 'stop'"
            @click="handleStop(deploy)"
          >{{ t('gpu.stop') }}</el-button>

          <el-button
            v-if="deploy.status === 'stopped'"
            size="small"
            type="danger"
            plain
            :loading="actionLoading[deploy.id] === 'delete'"
            @click="handleDelete(deploy)"
          >{{ t('gpu.delete') }}</el-button>
        </div>
      </div>

      <!-- Add new card -->
      <div
        class="bg-white rounded-xl border-2 border-dashed border-gray-200 p-5 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors min-h-[200px]"
        @click="openCreateDialog"
      >
        <el-icon class="text-3xl text-gray-300 mb-2"><Plus /></el-icon>
        <span class="text-sm text-gray-400">{{ t('gpu.newDeploy') }}</span>
      </div>
    </div>

    <!-- Create Deployment Dialog -->
    <el-dialog
      v-model="showCreateDialog"
      :title="t('gpu.newDeploy')"
      width="540px"
      :close-on-click-modal="false"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-position="top" class="space-y-1">
        <!-- Deploy name -->
        <el-form-item :label="t('gpu.deployName')" prop="deploy_name">
          <el-input v-model="form.deploy_name" placeholder="my-llm-deployment" />
        </el-form-item>

        <!-- Model path -->
        <el-form-item :label="t('gpu.modelPath')" prop="model_path">
          <el-input v-model="form.model_path" placeholder="namespace/model-name" />
        </el-form-item>

        <!-- SKU select -->
        <el-form-item :label="t('gpu.selectSku')" prop="sku_name">
          <el-select
            v-model="form.sku_name"
            class="w-full"
            :loading="loadingSkus"
            :placeholder="t('gpu.selectSku')"
            @change="onSkuChange"
          >
            <el-option
              v-for="sku in gpuSkus"
              :key="sku.name"
              :value="sku.name"
              :label="`${sku.display_name} · $${sku.price_per_hour.toFixed(2)}/${t('gpu.hrShort')}`"
            >
              <div class="flex justify-between items-center w-full">
                <span class="font-medium">{{ sku.display_name }}</span>
                <span class="text-gray-400 text-xs ml-4">${{ sku.price_per_hour.toFixed(2) }}/{{ t('gpu.hrShort') }}</span>
              </div>
              <div class="text-xs text-gray-400 mt-0.5">
                {{ sku.gpu_model }} · {{ sku.gpu_count }} GPU · {{ sku.vcpus }} vCPU · {{ sku.memory_gb }}GB {{ t('gpu.memory') }}
              </div>
            </el-option>
          </el-select>
        </el-form-item>

        <!-- Cost estimate -->
        <div v-if="selectedSku" class="p-3 bg-blue-50 rounded-lg text-sm space-y-1">
          <div class="flex justify-between">
            <span class="text-gray-600">{{ t('gpu.pricePerHr') }}</span>
            <span class="font-mono font-semibold">${{ selectedSku.price_per_hour.toFixed(2) }}/hr</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">{{ t('gpu.perDay') }}</span>
            <span class="font-mono">${{ (selectedSku.price_per_hour * 24).toFixed(2) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">{{ t('gpu.balance') }}</span>
            <span class="font-mono">${{ balance.toFixed(4) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">{{ t('gpu.canRunFor') }}</span>
            <span class="font-mono font-semibold text-emerald-600">
              {{ selectedSku.price_per_hour > 0 ? (balance / selectedSku.price_per_hour).toFixed(1) : '∞' }} {{ t('gpu.hours') }}
            </span>
          </div>
        </div>

        <el-alert v-if="createError" :title="createError" type="error" :closable="false" show-icon class="mt-2" />
      </el-form>

      <template #footer>
        <el-button @click="showCreateDialog = false">{{ t('apikeys.cancel') }}</el-button>
        <el-button type="primary" :loading="creating" @click="handleCreate">
          {{ t('gpu.newDeploy') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Plus, Loading } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '../api/index'
import {
  listMyDeployments,
  listPublicGPUSkus,
  createDeployment,
  stopDeployment,
  deleteDeployment,
  type GPUSku,
  type DeploymentWithCost,
} from '../api/gpu'

const { t } = useI18n()

const loading = ref(false)
const deployments = ref<DeploymentWithCost[]>([])
const gpuSkus = ref<GPUSku[]>([])
const loadingSkus = ref(false)
const showCreateDialog = ref(false)
const creating = ref(false)
const createError = ref('')
const actionLoading = ref<Record<number, string>>({})
const formRef = ref()
const balance = ref(0)
const balanceLoading = ref(false)

const form = reactive({
  deploy_name: '',
  model_path: '',
  sku_name: '',
})

const rules = {
  deploy_name: [{ required: true, message: t('gpu.valDeployName'), trigger: 'blur' }],
  model_path: [{ required: true, message: t('gpu.valModelPath'), trigger: 'blur' }],
  sku_name: [{ required: true, message: t('gpu.valSku'), trigger: 'change' }],
}

const selectedSku = computed(() =>
  gpuSkus.value.find((s) => s.name === form.sku_name) ?? null
)

function onSkuChange() {
  // reactive update handled by computed
}

function formatRunningTime(hours: number): string {
  if (!hours || hours <= 0) return '0h'
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

async function fetchBalance() {
  balanceLoading.value = true
  try {
    const res = await api.get('/user/balance')
    balance.value = res.data?.data?.balance_usd ?? 0
  } catch {
    balance.value = 0
  } finally {
    balanceLoading.value = false
  }
}

async function fetchDeployments() {
  loading.value = true
  try {
    const res = await listMyDeployments()
    deployments.value = res.data?.data ?? []
  } catch {
    ElMessage.error(t('common.error'))
  } finally {
    loading.value = false
  }
}

async function fetchGPUSkus() {
  loadingSkus.value = true
  try {
    const res = await listPublicGPUSkus()
    gpuSkus.value = (res.data?.data ?? []).filter((s) => s.enabled)
  } catch {
    // not critical
  } finally {
    loadingSkus.value = false
  }
}

function openCreateDialog() {
  form.deploy_name = ''
  form.model_path = ''
  form.sku_name = ''
  createError.value = ''
  showCreateDialog.value = true
}

onMounted(async () => {
  await Promise.all([fetchDeployments(), fetchBalance(), fetchGPUSkus()])
})

async function handleCreate() {
  await formRef.value?.validate(async (valid: boolean) => {
    if (!valid) return
    creating.value = true
    createError.value = ''
    try {
      await createDeployment({
        deploy_name: form.deploy_name,
        model_path: form.model_path,
        sku_name: form.sku_name,
      })
      ElMessage.success(t('gpu.createSuccess'))
      showCreateDialog.value = false
      await fetchDeployments()
    } catch (e: any) {
      const msg = e?.response?.data?.msg || ''
      if (msg.toLowerCase().includes('balance') || msg.toLowerCase().includes('insufficient')) {
        createError.value = t('gpu.insufficientBalance')
      } else {
        createError.value = msg || t('common.error')
      }
    } finally {
      creating.value = false
    }
  })
}

async function handleStop(deploy: DeploymentWithCost) {
  await ElMessageBox.confirm(t('gpu.confirmStop'), t('gpu.stop'), {
    type: 'warning',
    confirmButtonText: t('apikeys.confirm'),
    cancelButtonText: t('apikeys.cancel'),
  })
  actionLoading.value[deploy.id] = 'stop'
  try {
    await stopDeployment(deploy.id)
    ElMessage.success(t('gpu.stopSuccess'))
    await fetchDeployments()
  } catch {
    ElMessage.error(t('common.error'))
  } finally {
    delete actionLoading.value[deploy.id]
  }
}

async function handleDelete(deploy: DeploymentWithCost) {
  await ElMessageBox.confirm(t('gpu.confirmDelete'), t('gpu.delete'), {
    type: 'warning',
    confirmButtonText: t('apikeys.confirm'),
    cancelButtonText: t('apikeys.cancel'),
  })
  actionLoading.value[deploy.id] = 'delete'
  try {
    await deleteDeployment(deploy.id)
    ElMessage.success(t('gpu.deleteSuccess'))
    await fetchDeployments()
  } catch {
    ElMessage.error(t('common.error'))
  } finally {
    delete actionLoading.value[deploy.id]
  }
}
</script>
