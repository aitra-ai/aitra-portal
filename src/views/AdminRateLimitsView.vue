<template>
  <div class="p-6 max-w-5xl mx-auto">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">{{ t('rateLimit.title') }}</h1>
      <p class="text-gray-500 mt-1">{{ t('rateLimit.subtitle') }}</p>
    </div>

    <!-- Global Defaults -->
    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <h3 class="text-sm font-semibold text-blue-800 mb-1">{{ t('rateLimit.globalDefaults') }}</h3>
      <p class="text-sm text-blue-600">
        {{ t('rateLimit.defaultRPM') }}: <strong>{{ defaults.rpm }}</strong> · 
        {{ t('rateLimit.defaultTPM') }}: <strong>{{ formatNumber(defaults.tpm) }}</strong>
      </p>
      <p class="text-xs text-blue-400 mt-1">{{ t('rateLimit.defaultNote') }}</p>
    </div>

    <!-- Add Override -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <h3 class="text-sm font-semibold text-gray-700 mb-3">{{ t('rateLimit.addOverride') }}</h3>
      <div class="flex flex-wrap gap-3 items-end">
        <div>
          <label class="text-xs text-gray-500 block mb-1">{{ t('rateLimit.username') }}</label>
          <el-input v-model="newRL.username" :placeholder="t('rateLimit.usernamePlaceholder')" class="!w-40" />
        </div>
        <div>
          <label class="text-xs text-gray-500 block mb-1">RPM</label>
          <el-input-number v-model="newRL.rpm" :min="0" :max="10000" class="!w-32" />
        </div>
        <div>
          <label class="text-xs text-gray-500 block mb-1">TPM</label>
          <el-input-number v-model="newRL.tpm" :min="0" :max="10000000" :step="10000" class="!w-40" />
        </div>
        <el-button type="primary" @click="upsertRateLimit" :loading="saving">{{ t('rateLimit.save') }}</el-button>
      </div>
    </div>

    <!-- Overrides Table -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200">
      <el-table :data="overrides" v-loading="loading" stripe>
        <el-table-column prop="username" :label="t('rateLimit.username')" width="200" />
        <el-table-column prop="rpm" label="RPM" width="120">
          <template #default="{ row }">
            <span :class="row.rpm === 0 ? 'text-gray-400' : 'text-gray-900 font-medium'">
              {{ row.rpm === 0 ? t('rateLimit.unlimited') : row.rpm }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="tpm" label="TPM" width="150">
          <template #default="{ row }">
            <span :class="row.tpm === 0 ? 'text-gray-400' : 'text-gray-900 font-medium'">
              {{ row.tpm === 0 ? t('rateLimit.unlimited') : formatNumber(row.tpm) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column :label="t('rateLimit.updatedAt')" width="200">
          <template #default="{ row }">
            <span class="text-xs text-gray-400">{{ new Date(row.updated_at).toLocaleString() }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="t('common.actions')" width="120">
          <template #default="{ row }">
            <el-button type="danger" text size="small" @click="deleteRateLimit(row)">
              {{ t('common.delete') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '../api/index'

const { t } = useI18n()

interface RateLimitOverride {
  id: number
  user_id: number
  username: string
  rpm: number
  tpm: number
  updated_at: string
}

const defaults = ref({ rpm: 60, tpm: 100000 })
const overrides = ref<RateLimitOverride[]>([])
const loading = ref(false)
const saving = ref(false)
const newRL = ref({ username: '', rpm: 60, tpm: 100000 })

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`
  return String(n)
}

async function fetchRateLimits() {
  loading.value = true
  try {
    const res = await api.get<{ data: { defaults: { rpm: number; tpm: number }; overrides: RateLimitOverride[] } }>('/admin/rate_limits')
    const data = res.data?.data
    if (data) {
      defaults.value = data.defaults
      overrides.value = data.overrides ?? []
    }
  } catch {
    overrides.value = []
  } finally {
    loading.value = false
  }
}

async function upsertRateLimit() {
  if (!newRL.value.username) {
    ElMessage.warning(t('rateLimit.usernamePlaceholder'))
    return
  }
  saving.value = true
  try {
    await api.post('/admin/rate_limits', newRL.value)
    ElMessage.success(t('rateLimit.saved'))
    newRL.value = { username: '', rpm: defaults.value.rpm, tpm: defaults.value.tpm }
    await fetchRateLimits()
  } catch {
    ElMessage.error(t('rateLimit.saveFailed'))
  } finally {
    saving.value = false
  }
}

async function deleteRateLimit(row: RateLimitOverride) {
  await ElMessageBox.confirm(t('rateLimit.deleteConfirm', { username: row.username }), t('common.confirm'))
  try {
    await api.delete(`/admin/rate_limits/${row.user_id}`)
    ElMessage.success(t('common.deleted'))
    await fetchRateLimits()
  } catch {
    ElMessage.error(t('rateLimit.deleteFailed'))
  }
}

onMounted(fetchRateLimits)
</script>
