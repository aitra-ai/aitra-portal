<template>
  <div class="p-6 max-w-7xl mx-auto">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">{{ t('audit.title') }}</h1>
    </div>

    <!-- Summary cards -->
    <div v-if="summaryLoading" class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <el-skeleton v-for="i in 4" :key="i" :rows="2" animated class="p-4 bg-white rounded-lg shadow-sm" />
    </div>
    <div v-else class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
        <div class="text-xs text-gray-500 mb-1">{{ t('usage.totalCalls') }}</div>
        <div class="text-2xl font-bold text-gray-900">{{ formatNumber(auditSummary.total_requests) }}</div>
      </div>
      <div class="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
        <div class="text-xs text-gray-500 mb-1">{{ t('usage.inputTokens') }}</div>
        <div class="text-2xl font-bold text-blue-600">{{ formatNumber(auditSummary.total_input_tokens) }}</div>
      </div>
      <div class="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
        <div class="text-xs text-gray-500 mb-1">{{ t('usage.outputTokens') }}</div>
        <div class="text-2xl font-bold text-green-600">{{ formatNumber(auditSummary.total_output_tokens) }}</div>
      </div>
      <div class="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
        <div class="text-xs text-gray-500 mb-1">{{ t('audit.totalPlatformCost') }}</div>
        <div class="text-2xl font-bold text-orange-600">{{ formatCost(auditSummary.total_cost_usd) }}</div>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-100 p-4 mb-6">
      <div class="flex flex-wrap gap-3 items-center">
        <el-input
          v-model="filterUsername"
          :placeholder="t('audit.filterUser')"
          size="default"
          clearable
          style="width: 180px"
        />
        <el-input
          v-model="filterModelId"
          :placeholder="t('audit.filterModel')"
          size="default"
          clearable
          style="width: 200px"
        />
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="→"
          :start-placeholder="t('common.startDate')"
          :end-placeholder="t('common.endDate')"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          size="default"
          style="width: 260px"
        />
        <el-button type="primary" @click="onFilterChange">{{ t('common.query') }}</el-button>
        <el-button @click="onReset">{{ t('common.reset') }}</el-button>
      </div>
    </div>

    <!-- Rankings -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <!-- Top users -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
        <h2 class="text-base font-semibold text-gray-800 mb-3">{{ t('audit.topUsers') }}</h2>
        <div v-if="summaryLoading"><el-skeleton :rows="4" animated /></div>
        <el-empty v-else-if="topUsers.length === 0" :description="t('usage.noData')" class="py-4" />
        <el-table v-else :data="topUsers" size="small" stripe>
          <el-table-column prop="username" :label="t('audit.username')" min-width="120" />
          <el-table-column prop="total_requests" :label="t('usage.totalCalls')" width="80" align="right">
            <template #default="{ row }">{{ formatNumber(row.total_requests) }}</template>
          </el-table-column>
          <el-table-column prop="total_cost_usd" :label="t('usage.cost')" width="100" align="right">
            <template #default="{ row }">
              <span class="text-orange-600 font-mono text-xs">{{ formatCost(row.total_cost_usd) }}</span>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- Top models -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
        <h2 class="text-base font-semibold text-gray-800 mb-3">{{ t('audit.topModels') }}</h2>
        <div v-if="summaryLoading"><el-skeleton :rows="4" animated /></div>
        <el-empty v-else-if="topModels.length === 0" :description="t('usage.noData')" class="py-4" />
        <el-table v-else :data="topModels" size="small" stripe>
          <el-table-column prop="model_id" :label="t('usage.model')" min-width="140">
            <template #default="{ row }">
              <span class="font-mono text-xs">{{ row.model_id }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="total_requests" :label="t('usage.totalCalls')" width="80" align="right">
            <template #default="{ row }">{{ formatNumber(row.total_requests) }}</template>
          </el-table-column>
          <el-table-column prop="total_cost_usd" :label="t('usage.cost')" width="100" align="right">
            <template #default="{ row }">
              <span class="text-orange-600 font-mono text-xs">{{ formatCost(row.total_cost_usd) }}</span>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <!-- Full audit log -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
      <h2 class="text-base font-semibold text-gray-800 mb-4">{{ t('audit.allLogs') }}</h2>

      <div v-if="logsLoading"><el-skeleton :rows="6" animated /></div>
      <el-empty v-else-if="logs.length === 0" :description="t('usage.noData')" class="py-8" />
      <template v-else>
        <el-table :data="logs" class="w-full" stripe>
          <el-table-column prop="created_at" :label="t('usage.time')" width="170">
            <template #default="{ row }">
              <span class="text-xs text-gray-600">{{ formatTime(row.created_at) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="username" :label="t('audit.username')" width="120" />
          <el-table-column prop="model_id" :label="t('usage.model')" min-width="150">
            <template #default="{ row }">
              <span class="font-mono text-sm">{{ row.model_id }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="provider" :label="t('usage.provider')" width="110" />
          <el-table-column prop="input_tokens" :label="t('usage.inputTokens')" width="110" align="right">
            <template #default="{ row }">{{ formatNumber(row.input_tokens) }}</template>
          </el-table-column>
          <el-table-column prop="output_tokens" :label="t('usage.outputTokens')" width="110" align="right">
            <template #default="{ row }">{{ formatNumber(row.output_tokens) }}</template>
          </el-table-column>
          <el-table-column prop="cost_usd" :label="t('usage.cost')" width="100" align="right">
            <template #default="{ row }">
              <span class="text-orange-600 font-mono text-xs">{{ formatCost(row.cost_usd) }}</span>
            </template>
          </el-table-column>
        </el-table>

        <div class="mt-4 flex justify-end">
          <el-pagination
            v-model:current-page="page"
            v-model:page-size="perPage"
            :total="total"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next"
            @size-change="loadLogs"
            @current-change="loadLogs"
          />
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import api from '../api/index'

const { t } = useI18n()

interface UsageLog {
  id: number
  username: string
  model_id: string
  provider: string
  input_tokens: number
  output_tokens: number
  cost_usd: number
  created_at: string
}

interface TopUser {
  username: string
  total_requests: number
  total_input_tokens: number
  total_output_tokens: number
  total_cost_usd: number
}

interface TopModel {
  model_id: string
  provider: string
  total_requests: number
  total_input_tokens: number
  total_output_tokens: number
  total_cost_usd: number
}

interface AuditSummaryData {
  summary: {
    total_requests: number
    total_input_tokens: number
    total_output_tokens: number
    total_cost_usd: number
  }
  top_users: TopUser[]
  top_models: TopModel[]
}

// Filters
const filterUsername = ref('')
const filterModelId = ref('')
const dateRange = ref<[string, string] | null>(null)

// Summary
const summaryLoading = ref(false)
const auditSummary = ref({ total_requests: 0, total_input_tokens: 0, total_output_tokens: 0, total_cost_usd: 0 })
const topUsers = ref<TopUser[]>([])
const topModels = ref<TopModel[]>([])

// Logs
const logsLoading = ref(false)
const logs = ref<UsageLog[]>([])
const total = ref(0)
const page = ref(1)
const perPage = ref(20)

function formatNumber(n: number | undefined): string {
  if (n == null) return '0'
  return n.toLocaleString()
}

function formatCost(n: number | undefined): string {
  if (n == null) return '$0.0000'
  return `$${n.toFixed(4)}`
}

function formatTime(s: string): string {
  if (!s) return ''
  return s.replace('T', ' ').slice(0, 19)
}

function onFilterChange() {
  page.value = 1
  loadAll()
}

function onReset() {
  filterUsername.value = ''
  filterModelId.value = ''
  dateRange.value = null
  page.value = 1
  loadAll()
}

async function loadSummary() {
  summaryLoading.value = true
  try {
    const params: Record<string, string | number> = {}
    if (filterUsername.value) params.username = filterUsername.value
    if (filterModelId.value) params.model_id = filterModelId.value
    if (dateRange.value?.[0]) params.start_date = (dateRange.value as string[])[0]
    if (dateRange.value?.[1]) params.end_date = (dateRange.value as string[])[1]
    const res = await api.get('/admin/audit/summary', { params })
    // response: { msg, data: { summary, top_users, top_models } }
    const d = res.data?.data ?? {}
    auditSummary.value = d.summary ?? { total_requests: 0, total_input_tokens: 0, total_output_tokens: 0, total_cost_usd: 0 }
    topUsers.value = (d.top_users ?? []).slice(0, 10)
    topModels.value = (d.top_models ?? []).slice(0, 10)
  } catch (e) {
    console.error('audit summary error', e)
    ElMessage.error(t('common.loadError'))
  } finally {
    summaryLoading.value = false
  }
}

async function loadLogs() {
  logsLoading.value = true
  try {
    const params: Record<string, string | number> = {
      page: page.value,
      per_page: perPage.value,
    }
    if (filterUsername.value) params.username = filterUsername.value
    if (filterModelId.value) params.model_id = filterModelId.value
    if (dateRange.value?.[0]) params.start_date = (dateRange.value as string[])[0]
    if (dateRange.value?.[1]) params.end_date = (dateRange.value as string[])[1]

    const res = await api.get('/admin/audit/usage', { params })
    // response: { msg, data: { data: [...], total, page, per_page } }
    const inner = res.data?.data ?? {}
    logs.value = inner.data ?? []
    total.value = inner.total ?? 0
  } catch (e) {
    console.error('audit logs error', e)
    ElMessage.error(t('common.loadError'))
  } finally {
    logsLoading.value = false
  }
}

function loadAll() {
  loadSummary()
  loadLogs()
}

onMounted(loadAll)
</script>
