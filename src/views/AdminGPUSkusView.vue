<template>
  <div class="p-6 max-w-7xl mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">{{ t('gpu.adminTitle') }}</h1>
      </div>
      <el-button type="primary" :icon="Plus" @click="openAddDialog">
        {{ t('gpu.addSku') }}
      </el-button>
    </div>

    <!-- SKU Table -->
    <el-table
      :data="skus"
      v-loading="loadingSkus"
      border
      class="mb-8"
      row-key="id"
    >
      <el-table-column :label="t('gpu.skuName')" prop="name" min-width="130" />
      <el-table-column :label="t('gpu.skuDisplayName')" prop="display_name" min-width="160" />
      <el-table-column :label="t('gpu.skuGPUModel')" prop="gpu_model" min-width="140" />
      <el-table-column :label="t('gpu.skuVcpus')" prop="vcpus" width="90" align="center" />
      <el-table-column :label="t('gpu.skuMemory')" prop="memory_gb" width="100" align="center" />
      <el-table-column :label="t('gpu.skuGPUCount')" prop="gpu_count" width="90" align="center" />
      <el-table-column :label="t('gpu.skuPrice')" prop="price_per_hour" width="110" align="right">
        <template #default="{ row }">
          <span class="font-mono">${{ row.price_per_hour.toFixed(2) }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="t('gpu.skuEnabled')" width="100" align="center">
        <template #default="{ row }">
          <el-switch
            :model-value="row.enabled"
            :loading="toggleLoading[row.id]"
            @change="(val: boolean) => handleToggleEnabled(row, val)"
          />
        </template>
      </el-table-column>
      <el-table-column :label="t('common.actions')" width="130" align="center">
        <template #default="{ row }">
          <el-button size="small" text type="primary" @click="openEditDialog(row)">{{ t('common.edit') }}</el-button>
          <el-button size="small" text type="danger" @click="handleDeleteSku(row)">{{ t('common.delete') }}</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- All Deployments Section -->
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-semibold text-gray-800">{{ t('gpu.allDeployments') }}</h2>
      <el-button :icon="Refresh" @click="fetchAllDeployments" :loading="loadingDeployments">{{ t('common.refresh') }}</el-button>
    </div>

    <el-table
      :data="allDeployments"
      v-loading="loadingDeployments"
      border
      row-key="id"
    >
      <el-table-column :label="t('audit.username')" prop="username" min-width="100" />
      <el-table-column :label="t('gpu.deployName')" prop="deploy_name" min-width="130" />
      <el-table-column :label="t('gpu.modelPath')" prop="model_path" min-width="160" show-overflow-tooltip />
      <el-table-column :label="t('gpu.selectSku')" prop="sku_name" width="120" />
      <el-table-column :label="t('admin.extModels.status')" prop="status" width="90" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 'running' ? 'success' : 'info'" size="small">
            {{ row.status === 'running' ? t('gpu.running') : t('gpu.stopped') }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="t('gpu.runningHours')" prop="running_hours" width="120" align="right">
        <template #default="{ row }">
          <span class="font-mono">{{ row.running_hours.toFixed(2) }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="t('gpu.totalBilled')" prop="total_billed_usd" width="110" align="right">
        <template #default="{ row }">
          <span class="font-mono">${{ row.total_billed_usd.toFixed(4) }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="t('gpu.startedAt')" prop="started_at" min-width="160">
        <template #default="{ row }">
          {{ formatDate(row.started_at) }}
        </template>
      </el-table-column>
    </el-table>

    <!-- Add/Edit SKU Dialog -->
    <el-dialog
      v-model="showSkuDialog"
      :title="editingId ? t('gpu.editSku') : t('gpu.addSku')"
      width="480px"
      :close-on-click-modal="false"
    >
      <el-form :model="skuForm" :rules="skuRules" ref="skuFormRef" label-position="top">
        <div class="grid grid-cols-2 gap-x-4">
          <el-form-item :label="t('gpu.skuName')" prop="name">
            <el-input v-model="skuForm.name" placeholder="t4-1x" :disabled="!!editingId" />
          </el-form-item>
          <el-form-item :label="t('gpu.skuDisplayName')" prop="display_name">
            <el-input v-model="skuForm.display_name" placeholder="NVIDIA T4 (16GB)" />
          </el-form-item>
          <el-form-item :label="t('gpu.skuGPUModel')" prop="gpu_model">
            <el-input v-model="skuForm.gpu_model" placeholder="NVIDIA T4" />
          </el-form-item>
          <el-form-item :label="t('gpu.skuPrice')" prop="price_per_hour">
            <el-input-number
              v-model="skuForm.price_per_hour"
              :precision="4"
              :min="0"
              :step="0.01"
              class="w-full"
            />
          </el-form-item>
          <el-form-item :label="t('gpu.skuVcpus')" prop="vcpus">
            <el-input-number v-model="skuForm.vcpus" :min="1" :max="256" class="w-full" />
          </el-form-item>
          <el-form-item :label="t('gpu.skuMemory')" prop="memory_gb">
            <el-input-number v-model="skuForm.memory_gb" :min="1" :max="2048" class="w-full" />
          </el-form-item>
          <el-form-item :label="t('gpu.skuGPUCount')" prop="gpu_count">
            <el-input-number v-model="skuForm.gpu_count" :min="0" :max="16" class="w-full" />
          </el-form-item>
          <el-form-item :label="t('gpu.skuEnabled')" prop="enabled">
            <el-switch v-model="skuForm.enabled" class="mt-2" />
          </el-form-item>
        </div>
      </el-form>

      <template #footer>
        <el-button @click="showSkuDialog = false">{{ t('apikeys.cancel') }}</el-button>
        <el-button type="primary" :loading="savingSku" @click="handleSaveSku">
          {{ editingId ? t('common.save') : t('common.add') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Plus, Refresh } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  adminListGPUSkus,
  adminCreateGPUSku,
  adminUpdateGPUSku,
  adminDeleteGPUSku,
  adminListDeployments,
  type GPUSku,
  type DeploymentWithCost,
} from '../api/gpu'

const { t } = useI18n()

const skus = ref<GPUSku[]>([])
const loadingSkus = ref(false)
const allDeployments = ref<DeploymentWithCost[]>([])
const loadingDeployments = ref(false)
const showSkuDialog = ref(false)
const savingSku = ref(false)
const editingId = ref<number | null>(null)
const skuFormRef = ref()
const toggleLoading = ref<Record<number, boolean>>({})

const skuForm = reactive({
  name: '',
  display_name: '',
  gpu_model: '',
  vcpus: 8,
  memory_gb: 32,
  gpu_count: 1,
  price_per_hour: 0.5,
  enabled: true,
})

const skuRules = {
  name: [{ required: true, message: t('gpu.valSkuName'), trigger: 'blur' }],
  display_name: [{ required: true, message: t('gpu.valDisplayName'), trigger: 'blur' }],
  gpu_model: [{ required: true, message: t('gpu.valGPUModel'), trigger: 'blur' }],
  price_per_hour: [{ required: true, message: t('gpu.valPrice'), trigger: 'blur' }],
}

function formatDate(s: string): string {
  if (!s || s.startsWith('0001')) return '-'
  return new Date(s).toLocaleString('zh-CN')
}

async function fetchSkus() {
  loadingSkus.value = true
  try {
    const res = await adminListGPUSkus()
    skus.value = res.data?.data ?? []
  } catch {
    ElMessage.error(t('common.error'))
  } finally {
    loadingSkus.value = false
  }
}

async function fetchAllDeployments() {
  loadingDeployments.value = true
  try {
    const res = await adminListDeployments()
    allDeployments.value = res.data?.data ?? []
  } catch {
    ElMessage.error(t('common.error'))
  } finally {
    loadingDeployments.value = false
  }
}

onMounted(() => {
  fetchSkus()
  fetchAllDeployments()
})

function openAddDialog() {
  editingId.value = null
  Object.assign(skuForm, {
    name: '',
    display_name: '',
    gpu_model: '',
    vcpus: 8,
    memory_gb: 32,
    gpu_count: 1,
    price_per_hour: 0.5,
    enabled: true,
  })
  showSkuDialog.value = true
}

function openEditDialog(row: GPUSku) {
  editingId.value = row.id
  Object.assign(skuForm, {
    name: row.name,
    display_name: row.display_name,
    gpu_model: row.gpu_model,
    vcpus: row.vcpus,
    memory_gb: row.memory_gb,
    gpu_count: row.gpu_count,
    price_per_hour: row.price_per_hour,
    enabled: row.enabled,
  })
  showSkuDialog.value = true
}

async function handleSaveSku() {
  await skuFormRef.value?.validate(async (valid: boolean) => {
    if (!valid) return
    savingSku.value = true
    try {
      if (editingId.value) {
        await adminUpdateGPUSku(editingId.value, { ...skuForm })
        ElMessage.success(t('gpu.skuUpdated'))
      } else {
        await adminCreateGPUSku({ ...skuForm })
        ElMessage.success(t('gpu.skuAdded'))
      }
      showSkuDialog.value = false
      await fetchSkus()
    } catch (e: any) {
      ElMessage.error(e?.response?.data?.msg || t('common.error'))
    } finally {
      savingSku.value = false
    }
  })
}

async function handleToggleEnabled(row: GPUSku, val: boolean) {
  toggleLoading.value[row.id] = true
  try {
    // Must send full SKU fields — backend Update() writes all columns.
    // Sending only { enabled } would zero out display_name, price, etc.
    await adminUpdateGPUSku(row.id, { ...row, enabled: val })
    row.enabled = val
    ElMessage.success(val ? t('common.enabled') : t('common.disabled'))
  } catch {
    ElMessage.error(t('common.error'))
  } finally {
    delete toggleLoading.value[row.id]
  }
}

async function handleDeleteSku(row: GPUSku) {
  await ElMessageBox.confirm(
    `${t('gpu.confirmDeleteSku')} "${row.display_name}"?`,
    t('common.deleteConfirm'),
    {
      type: 'warning',
      confirmButtonText: t('apikeys.confirm'),
      cancelButtonText: t('apikeys.cancel'),
    }
  )
  try {
    await adminDeleteGPUSku(row.id)
    ElMessage.success(t('gpu.skuDeleted'))
    await fetchSkus()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.msg || t('common.error'))
  }
}
</script>
