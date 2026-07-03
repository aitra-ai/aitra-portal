<template>
  <div class="p-6 max-w-6xl mx-auto">
    <!-- Header -->
    <div class="mb-6 flex items-center justify-between flex-wrap gap-3">
      <h1 class="text-2xl font-bold text-gray-900">{{ t('usage.title') }}</h1>
      <div class="flex items-center gap-2">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="→"
          :start-placeholder="t('common.startDate')"
          :end-placeholder="t('common.endDate')"
          format="YYYY-MM-DD"
          value-format="YYYY-MM-DD"
          style="width: 260px"
          @change="onDateChange"
        />
        <el-button @click="resetToThisMonth">{{ t('usage.thisMonth') }}</el-button>
      </div>
    </div>

    <!-- Rate Limit Quota -->
    <div v-if="rateLimit.rpm > 0 || rateLimit.tpm > 0" class="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-6">
      <h3 class="text-sm font-semibold text-blue-800 mb-2">{{ t('rateLimit.myQuota') }}</h3>
      <div class="flex gap-6">
        <div class="flex items-center gap-2">
          <span class="text-xs text-blue-600">{{ t('rateLimit.rpm') }}:</span>
          <span class="text-sm font-bold text-blue-900">{{ rateLimit.rpm === 0 ? t('rateLimit.unlimited') : rateLimit.rpm }}</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-xs text-blue-600">{{ t('rateLimit.tpm') }}:</span>
          <span class="text-sm font-bold text-blue-900">{{ rateLimit.tpm === 0 ? t('rateLimit.unlimited') : formatNumber(rateLimit.tpm) }}</span>
        </div>
      </div>
    </div>

    <!-- Monthly Budget -->
    <div v-if="budget.monthly_budget_usd > 0" class="bg-white rounded-lg shadow-sm border p-4 mb-6" :class="budget.percentage >= 100 ? 'border-red-300 bg-red-50' : budget.percentage >= 80 ? 'border-yellow-300 bg-yellow-50' : 'border-gray-100'">
      <div class="flex items-center justify-between mb-2">
        <h3 class="text-sm font-semibold" :class="budget.percentage >= 100 ? 'text-red-800' : budget.percentage >= 80 ? 'text-yellow-800' : 'text-gray-800'">
          {{ t('usage.monthlyBudget') }}
        </h3>
        <div class="flex items-center gap-2">
          <span class="text-sm font-mono" :class="budget.percentage >= 100 ? 'text-red-600' : 'text-gray-600'">
            ${{ budget.current_spend_usd.toFixed(4) }} / ${{ budget.monthly_budget_usd.toFixed(2) }}
          </span>
          <el-button size="small" text @click="showBudgetDialog = true">{{ t('usage.editBudget') }}</el-button>
        </div>
      </div>
      <el-progress
        :percentage="budget.percentage"
        :stroke-width="10"
        :color="budget.percentage >= 100 ? '#ef4444' : budget.percentage >= 80 ? '#f59e0b' : '#3b82f6'"
        :show-text="false"
      />
      <p v-if="budget.percentage >= 100" class="text-xs text-red-600 mt-1">{{ t('usage.budgetExceeded') }}</p>
      <p v-else-if="budget.percentage >= 80" class="text-xs text-yellow-600 mt-1">{{ t('usage.budgetWarning') }}</p>
    </div>
    <div v-else class="mb-4 text-right">
      <el-button size="small" text @click="showBudgetDialog = true">{{ t('usage.setBudget') }}</el-button>
    </div>

    <!-- Budget Setting Dialog -->
    <el-dialog v-model="showBudgetDialog" :title="t('usage.budgetSettings')" width="400px">
      <el-form label-position="top">
        <el-form-item :label="t('usage.monthlyBudgetLabel')">
          <el-input-number v-model="budgetForm" :min="0" :max="10000" :step="5" :precision="2" class="w-full" />
          <p class="text-xs text-gray-400 mt-1">{{ t('usage.budgetHint') }}</p>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showBudgetDialog = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" @click="saveBudget" :loading="savingBudget">{{ t('common.save') }}</el-button>
      </template>
    </el-dialog>

    <!-- Account Balance -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div class="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg p-4">
        <div class="text-xs text-emerald-600 mb-1">{{ t('usage.currentBalance') }}</div>
        <div class="text-2xl font-bold text-emerald-700">${{ balanceData.balance_usd.toFixed(4) }}</div>
      </div>
      <div class="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
        <div class="text-xs text-blue-600 mb-1">{{ t('usage.totalTopUp') }}</div>
        <div class="text-2xl font-bold text-blue-700">${{ (balanceData.balance_usd + balanceData.spent_usd).toFixed(4) }}</div>
      </div>
      <div class="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-4">
        <div class="text-xs text-orange-600 mb-1">{{ t('usage.totalSpent') }}</div>
        <div class="text-2xl font-bold text-orange-700">${{ balanceData.spent_usd.toFixed(4) }}</div>
      </div>
    </div>

    <!-- Grant History -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-100 p-5 mb-6">
      <h2 class="text-base font-semibold text-gray-800 mb-4">{{ t('usage.grantHistory') }}</h2>
      <el-empty v-if="balanceData.grants.length === 0" :description="t('usage.noGrants')" class="py-6" />
      <el-table v-else :data="[...balanceData.grants].reverse()" stripe class="w-full">
        <el-table-column prop="created_at" :label="t('usage.time')" width="180">
          <template #default="{ row }">
            <span class="text-xs text-gray-600">{{ formatTime(row.created_at) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="amount_usd" :label="t('usage.amount')" width="120" align="right">
          <template #default="{ row }">
            <span class="text-emerald-600 font-mono font-semibold">+${{ row.amount_usd?.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="note" :label="t('usage.note')" min-width="200">
          <template #default="{ row }">
            <span class="text-sm text-gray-600">{{ row.note || '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="granted_by" :label="t('usage.grantedBy')" width="140">
          <template #default="{ row }">
            <span class="text-sm text-gray-500">{{ row.granted_by || '—' }}</span>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- Summary cards -->
    <div v-if="summaryLoading" class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <el-skeleton v-for="i in 4" :key="i" :rows="2" animated class="p-4 bg-white rounded-lg shadow-sm" />
    </div>
    <div v-else class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
        <div class="text-xs text-gray-500 mb-1">{{ t('usage.totalCalls') }}</div>
        <div class="text-2xl font-bold text-gray-900">{{ formatNumber(summary.total.total_requests) }}</div>
      </div>
      <div class="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
        <div class="text-xs text-gray-500 mb-1">{{ t('usage.inputTokens') }}</div>
        <div class="text-2xl font-bold text-blue-600">{{ formatNumber(summary.total.total_input_tokens) }}</div>
      </div>
      <div class="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
        <div class="text-xs text-gray-500 mb-1">{{ t('usage.outputTokens') }}</div>
        <div class="text-2xl font-bold text-green-600">{{ formatNumber(summary.total.total_output_tokens) }}</div>
      </div>
      <div class="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
        <div class="text-xs text-gray-500 mb-1">{{ t('usage.estimatedCost') }}</div>
        <div class="text-2xl font-bold text-orange-600">{{ formatCost(summary.total.total_cost_usd) }}</div>
      </div>
    </div>

    <!-- Per-model breakdown -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-100 p-5 mb-6">
      <h2 class="text-base font-semibold text-gray-800 mb-4">{{ t('usage.byModel') }}</h2>
      <div v-if="summaryLoading">
        <el-skeleton :rows="3" animated />
      </div>
      <div v-else-if="summary.by_model.length === 0" class="text-center text-gray-400 py-6">
        {{ t('usage.noData') }}
      </div>
      <div v-else class="space-y-3">
        <div v-for="m in summary.by_model" :key="m.model_id + m.provider" class="flex items-center gap-3">
          <div class="w-52 shrink-0">
            <span class="font-mono text-sm text-gray-800">{{ m.model_id }}</span>
            <span class="ml-1 text-xs text-gray-400">{{ m.provider }}</span>
          </div>
          <div class="w-16 text-xs text-gray-500 text-right shrink-0">{{ m.total_requests }} {{ t('common.calls') }}</div>
          <div class="flex-1">
            <el-progress
              :percentage="maxModelCost > 0 ? Math.round((m.total_cost_usd / maxModelCost) * 100) : 0"
              :show-text="false"
              :stroke-width="8"
              color="#3b82f6"
            />
          </div>
          <div class="w-24 text-xs text-gray-600 text-right shrink-0">{{ formatCost(m.total_cost_usd) }}</div>
        </div>
      </div>
    </div>

    <!-- Detail table -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
      <div class="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 class="text-base font-semibold text-gray-800">{{ t('usage.callDetails') }}</h2>
        <div class="flex items-center gap-2">
          <el-select v-model="filterModel" :placeholder="t('usage.allModels')" clearable size="small" style="width: 180px" @change="onFilterChange">
            <el-option v-for="m in availableModels" :key="m" :label="m" :value="m" />
          </el-select>
          <el-select v-model="filterStatus" :placeholder="t('usage.allStatus')" clearable size="small" style="width: 130px" @change="onFilterChange">
            <el-option label="200 OK" :value="200" />
            <el-option label="400 Bad Request" :value="400" />
            <el-option label="429 Rate Limit" :value="429" />
            <el-option label="500 Error" :value="500" />
          </el-select>
        </div>
      </div>

      <div v-if="logsLoading">
        <el-skeleton :rows="5" animated />
      </div>
      <el-empty
        v-else-if="logs.length === 0"
        :description="t('usage.noData')"
        class="py-8"
      />
      <template v-else>
        <el-table :data="logs" class="w-full" stripe>
          <el-table-column prop="created_at" :label="t('usage.time')" width="180">
            <template #default="{ row }">
              <span class="text-xs text-gray-600">{{ formatTime(row.created_at) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="model_id" :label="t('usage.model')" min-width="160">
            <template #default="{ row }">
              <span class="font-mono text-sm">{{ row.model_id }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="provider" :label="t('usage.provider')" width="120" />
          <el-table-column prop="status_code" :label="t('usage.statusCode')" width="90" align="center">
            <template #default="{ row }">
              <el-tag
                size="small"
                :type="row.status_code === 200 ? 'success' : row.status_code >= 500 ? 'danger' : 'warning'"
              >{{ row.status_code || 200 }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="latency_ms" :label="t('usage.latency')" width="100" align="right">
            <template #default="{ row }">
              <span class="font-mono text-xs text-gray-600">{{ row.latency_ms ? row.latency_ms + 'ms' : '—' }}</span>
            </template>
          </el-table-column>
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
            :page-sizes="[10, 20, 50]"
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
import { ref, computed, onMounted } from 'vue'
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
  status_code: number
  latency_ms: number
  request_summary: string
  created_at: string
}

interface ModelSummary {
  model_id: string
  provider: string
  total_requests: number
  total_input_tokens: number
  total_output_tokens: number
  total_cost_usd: number
}

interface UsageSummary {
  by_model: ModelSummary[]
  total: {
    total_requests: number
    total_input_tokens: number
    total_output_tokens: number
    total_cost_usd: number
  }
}

// Date range — default to this month
function getThisMonthRange(): [string, string] {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const firstDay = `${y}-${m}-01`
  const lastDay = `${y}-${m}-${new Date(y, now.getMonth() + 1, 0).getDate()}`
  return [firstDay, lastDay]
}

const dateRange = ref<[string, string]>(getThisMonthRange())

// Rate limit
const rateLimit = ref({ rpm: 0, tpm: 0 })

// Summary
const summaryLoading = ref(false)
const summary = ref<UsageSummary>({
  by_model: [],
  total: { total_requests: 0, total_input_tokens: 0, total_output_tokens: 0, total_cost_usd: 0 },
})

const maxModelCost = computed(() =>
  summary.value.by_model.reduce((max, m) => Math.max(max, m.total_cost_usd), 0)
)

// Logs
// Budget
const budget = ref({ monthly_budget_usd: 0, current_spend_usd: 0, percentage: 0 })

// Balance data
const balanceData = ref({ balance_usd: 0, spent_usd: 0, grants: [] as any[] })
const balanceLoading = ref(false)

async function loadBalance() {
  balanceLoading.value = true
  try {
    const res = await api.get('/user/balance')
    balanceData.value = res.data?.data ?? { balance_usd: 0, spent_usd: 0, grants: [] }
  } catch { balanceData.value = { balance_usd: 0, spent_usd: 0, grants: [] } }
  finally { balanceLoading.value = false }
}
const showBudgetDialog = ref(false)
const budgetForm = ref(0)
const savingBudget = ref(false)

async function loadBudget() {
  try {
    const res = await api.get('/user/settings/budget')
    budget.value = res.data?.data ?? { monthly_budget_usd: 0, current_spend_usd: 0, percentage: 0 }
    budgetForm.value = budget.value.monthly_budget_usd
  } catch { /* ignore */ }
}

async function saveBudget() {
  savingBudget.value = true
  try {
    await api.put('/user/settings/budget', { monthly_budget_usd: budgetForm.value })
    budget.value.monthly_budget_usd = budgetForm.value
    budget.value.percentage = budgetForm.value > 0 ? Math.min(100, (budget.value.current_spend_usd / budgetForm.value) * 100) : 0
    showBudgetDialog.value = false
    ElMessage.success(t('usage.budgetSaved'))
  } catch {
    ElMessage.error(t('common.error'))
  } finally {
    savingBudget.value = false
  }
}

const logsLoading = ref(false)
const logs = ref<UsageLog[]>([])
const total = ref(0)
const page = ref(1)
const perPage = ref(20)
const filterModel = ref('')
const filterStatus = ref<number | ''>('')
const availableModels = ref<string[]>([])

function onFilterChange() {
  page.value = 1
  loadLogs()
}

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

function resetToThisMonth() {
  dateRange.value = getThisMonthRange()
  page.value = 1
  loadAll()
}

function onDateChange() {
  page.value = 1
  loadAll()
}

async function loadSummary() {
  summaryLoading.value = true
  try {
    const params: Record<string, string> = {}
    if (dateRange.value?.[0]) params.start_date = dateRange.value[0]
    if (dateRange.value?.[1]) params.end_date = dateRange.value[1]
    const res = await api.get('/user/usage/summary', { params })
    // API returns: { msg, data: ModelSummary[] } — a flat array per model
    const byModel: ModelSummary[] = res.data?.data ?? []
    // Aggregate totals from per-model stats
    const agg = byModel.reduce(
      (acc, m) => {
        acc.total_requests += m.total_requests ?? 0
        acc.total_input_tokens += m.total_input_tokens ?? 0
        acc.total_output_tokens += m.total_output_tokens ?? 0
        acc.total_cost_usd += m.total_cost_usd ?? 0
        return acc
      },
      { total_requests: 0, total_input_tokens: 0, total_output_tokens: 0, total_cost_usd: 0 }
    )
    summary.value = { by_model: byModel, total: agg }
    availableModels.value = byModel.map(m => m.model_id)
  } catch (e) {
    console.error('usage summary error', e)
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
    if (dateRange.value?.[0]) params.start_date = dateRange.value[0]
    if (dateRange.value?.[1]) params.end_date = dateRange.value[1]
    if (filterModel.value) params.model_id = filterModel.value
    if (filterStatus.value !== '') params.status_code = filterStatus.value

    const res = await api.get('/user/usage', { params })
    // API returns: { msg, data: { data: [...], page, per_page, total } }
    const inner = res.data?.data ?? {}
    logs.value = inner.data ?? []
    total.value = inner.total ?? 0
  } catch (e) {
    console.error('usage logs error', e)
    ElMessage.error(t('common.loadError'))
  } finally {
    logsLoading.value = false
  }
}

async function loadRateLimit() {
  try {
    const res = await api.get<{ data: { rpm: number; tpm: number } }>('/user/rate_limit')
    rateLimit.value = res.data?.data ?? { rpm: 0, tpm: 0 }
  } catch {
    // ignore
  }
}

function loadAll() {
  loadSummary()
  loadLogs()
  loadRateLimit()
}

onMounted(() => {
  loadAll()
  loadBudget()
  loadBalance()
})
</script>
