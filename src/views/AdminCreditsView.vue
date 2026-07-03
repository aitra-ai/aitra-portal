<template>
  <div class="p-6 max-w-6xl mx-auto">
    <div class="mb-6 flex items-center justify-between flex-wrap gap-3">
      <h1 class="text-2xl font-bold text-gray-900">{{ t('credits.title') }}</h1>
      <div class="flex items-center gap-2">
        <el-input v-model="search" :placeholder="t('credits.searchUser')" clearable size="default" style="width: 220px" :prefix-icon="Search" />
        <el-button type="primary" @click="openGrantDialog()">{{ t('credits.grantCredit') }}</el-button>
      </div>
    </div>

    <div class="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
      <div v-if="loading">
        <el-skeleton :rows="5" animated />
      </div>
      <el-empty v-else-if="filteredUsers.length === 0" :description="t('credits.noUsers')" />
      <el-table v-else :data="filteredUsers" stripe class="w-full" :default-sort="{ prop: 'balance_usd', order: 'descending' }">
        <el-table-column prop="username" :label="t('credits.username')" min-width="160" sortable />
        <el-table-column prop="total_granted_usd" :label="t('credits.totalGranted')" width="150" align="right" sortable>
          <template #default="{ row }">
            <span class="font-mono text-blue-600">${{ row.total_granted_usd?.toFixed(2) ?? '0.00' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="total_spent_usd" :label="t('credits.totalSpent')" width="150" align="right" sortable>
          <template #default="{ row }">
            <span class="font-mono text-orange-600">${{ row.total_spent_usd?.toFixed(2) ?? '0.00' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="balance_usd" :label="t('credits.balance')" width="150" align="right" sortable>
          <template #default="{ row }">
            <span :class="['font-mono font-semibold', row.balance_usd <= 1 ? 'text-red-600' : 'text-emerald-600']">
              ${{ row.balance_usd?.toFixed(4) ?? '0.0000' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column :label="t('common.actions')" width="120" align="center">
          <template #default="{ row }">
            <el-button size="small" type="primary" text @click="openGrantDialog(row.username)">
              {{ t('credits.grant') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- Grant Dialog -->
    <el-dialog v-model="showGrantDialog" :title="t('credits.grantTitle')" width="420px">
      <el-form label-position="top">
        <el-form-item :label="t('credits.username')">
          <el-input v-model="grantForm.username" :placeholder="t('credits.usernamePlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('credits.amount')">
          <el-input-number v-model="grantForm.amount_usd" :min="0.01" :max="10000" :step="5" :precision="2" class="w-full" />
        </el-form-item>
        <el-form-item :label="t('credits.note')">
          <el-input v-model="grantForm.note" type="textarea" :rows="2" :placeholder="t('credits.notePlaceholder')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showGrantDialog = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="granting" :disabled="!grantForm.username || grantForm.amount_usd <= 0" @click="submitGrant">
          {{ t('credits.confirmGrant') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import api from '../api/index'

const { t } = useI18n()

interface UserBalance {
  username: string
  total_granted_usd: number
  total_spent_usd: number
  balance_usd: number
}

const loading = ref(false)
const users = ref<UserBalance[]>([])
const search = ref('')

const filteredUsers = computed(() => {
  if (!search.value) return users.value
  const q = search.value.toLowerCase()
  return users.value.filter(u => u.username.toLowerCase().includes(q))
})

async function loadUsers() {
  loading.value = true
  try {
    const res = await api.get('/admin/credits')
    users.value = res.data?.data ?? []
  } catch {
    ElMessage.error(t('common.loadError'))
  } finally {
    loading.value = false
  }
}

// Grant dialog
const showGrantDialog = ref(false)
const granting = ref(false)
const grantForm = ref({ username: '', amount_usd: 10, note: '' })

function openGrantDialog(username = '') {
  grantForm.value = { username, amount_usd: 10, note: '' }
  showGrantDialog.value = true
}

async function submitGrant() {
  granting.value = true
  try {
    await api.post('/admin/credits/grant', grantForm.value)
    ElMessage.success(t('credits.grantSuccess', { amount: grantForm.value.amount_usd, user: grantForm.value.username }))
    showGrantDialog.value = false
    loadUsers()
  } catch {
    ElMessage.error(t('common.error'))
  } finally {
    granting.value = false
  }
}

onMounted(loadUsers)
</script>
