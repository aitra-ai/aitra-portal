<template>
  <div class="p-6 max-w-6xl mx-auto">
    <!-- Header -->
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">{{ t('mcp.title') }}</h1>
        <p class="text-gray-500 mt-1 text-sm">{{ t('mcp.subtitle') }}</p>
      </div>
      <el-button type="primary" :icon="Plus" @click="openAddDialog">
        {{ t('mcp.addService') }}
      </el-button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-20">
      <el-icon class="animate-spin text-blue-500 text-3xl"><Loading /></el-icon>
    </div>

    <!-- Empty -->
    <el-empty v-else-if="resources.length === 0" :description="t('mcp.noServices')" class="py-16">
      <el-button type="primary" :icon="Plus" @click="openAddDialog">
        {{ t('mcp.addService') }}
      </el-button>
    </el-empty>

    <!-- Table -->
    <el-table v-else :data="resources" stripe class="w-full">
      <el-table-column prop="name" :label="t('mcp.name')" min-width="160">
        <template #default="{ row }">
          <div>
            <span class="font-semibold text-gray-900">{{ row.name }}</span>
            <p v-if="row.description" class="text-xs text-gray-400 mt-0.5 truncate" style="max-width: 300px">{{ row.description }}</p>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="url" :label="t('mcp.endpoint')" min-width="240">
        <template #default="{ row }">
          <span class="font-mono text-xs text-gray-600">{{ row.url }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="protocol" :label="t('mcp.protocol')" width="100">
        <template #default="{ row }">
          <el-tag size="small" :type="row.protocol === 'streamable' ? 'success' : 'info'">
            {{ row.protocol || 'sse' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="owner" :label="t('mcp.owner')" width="120">
        <template #default="{ row }">
          <span class="text-sm text-gray-600">{{ row.owner || '—' }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="t('apikeys.actions')" width="160" align="center">
        <template #default="{ row }">
          <el-button size="small" @click="openEditDialog(row)">{{ t('billing.editConfig') }}</el-button>
          <el-button size="small" type="danger" plain @click="deleteResource(row)">{{ t('admin.extModels.delete') }}</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- Pagination -->
    <div v-if="total > perPage" class="mt-4 flex justify-end">
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="perPage"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @size-change="loadResources"
        @current-change="loadResources"
      />
    </div>

    <!-- Add/Edit Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="isAdding ? t('mcp.addService') : t('mcp.editService')"
      width="520px"
      destroy-on-close
    >
      <el-form :model="form" label-position="top">
        <el-form-item :label="t('mcp.name')" required>
          <el-input v-model="form.name" placeholder="my-mcp-service" />
        </el-form-item>
        <el-form-item :label="t('mcp.endpoint')" required>
          <el-input v-model="form.url" placeholder="https://mcp.example.com/sse" />
        </el-form-item>
        <el-form-item :label="t('mcp.description')">
          <el-input v-model="form.description" type="textarea" :rows="2" :placeholder="t('mcp.descriptionPlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('mcp.protocol')">
          <el-select v-model="form.protocol" class="w-full">
            <el-option label="SSE" value="sse" />
            <el-option label="Streamable HTTP" value="streamable" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('mcp.owner')">
          <el-input v-model="form.owner" placeholder="admin" />
        </el-form-item>
        <el-form-item :label="t('mcp.headers')">
          <el-input v-model="form.headers" type="textarea" :rows="3" :placeholder="t('mcp.headersPlaceholder')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="flex justify-end gap-2">
          <el-button @click="dialogVisible = false">{{ t('admin.extModels.cancel') }}</el-button>
          <el-button type="primary" :loading="saving" @click="saveForm">{{ t('admin.extModels.save') }}</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Loading, Plus } from '@element-plus/icons-vue'
import api from '../api/index'

const { t } = useI18n()

interface MCPResource {
  id: number
  name: string
  description: string
  url: string
  protocol: string
  owner: string
  headers: Record<string, any> | null
  need_install: boolean
}

const loading = ref(false)
const saving = ref(false)
const resources = ref<MCPResource[]>([])
const total = ref(0)
const page = ref(1)
const perPage = ref(20)
const dialogVisible = ref(false)
const isAdding = ref(true)
const editingId = ref<number | null>(null)

const form = reactive({
  name: '',
  description: '',
  url: '',
  protocol: 'sse',
  owner: '',
  headers: '',
})

function resetForm() {
  form.name = ''
  form.description = ''
  form.url = ''
  form.protocol = 'sse'
  form.owner = ''
  form.headers = ''
}

function openAddDialog() {
  isAdding.value = true
  editingId.value = null
  resetForm()
  dialogVisible.value = true
}

function openEditDialog(row: MCPResource) {
  isAdding.value = false
  editingId.value = row.id
  form.name = row.name
  form.description = row.description
  form.url = row.url
  form.protocol = row.protocol || 'sse'
  form.owner = row.owner || ''
  form.headers = row.headers ? JSON.stringify(row.headers, null, 2) : ''
  dialogVisible.value = true
}

function parseHeaders(raw: string): Record<string, any> | null {
  if (!raw.trim()) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

async function saveForm() {
  if (!form.name || !form.url) {
    ElMessage.warning(t('admin.extModels.requiredFields'))
    return
  }
  saving.value = true
  try {
    const payload = {
      name: form.name,
      description: form.description,
      url: form.url,
      protocol: form.protocol,
      owner: form.owner,
      headers: parseHeaders(form.headers),
    }
    if (isAdding.value) {
      await api.post('/admin/mcp', payload)
      ElMessage.success(t('mcp.createSuccess'))
    } else {
      await api.put(`/admin/mcp/${editingId.value}`, payload)
      ElMessage.success(t('mcp.updateSuccess'))
    }
    dialogVisible.value = false
    await loadResources()
  } catch {
    ElMessage.error('Failed to save')
  } finally {
    saving.value = false
  }
}

async function deleteResource(row: MCPResource) {
  try {
    await ElMessageBox.confirm(
      `${t('mcp.confirmDelete')} "${row.name}"?`,
      t('admin.extModels.delete'),
      { type: 'warning', confirmButtonText: t('admin.extModels.delete'), cancelButtonText: t('admin.extModels.cancel') }
    )
  } catch { return }
  try {
    await api.delete(`/admin/mcp/${row.id}`)
    ElMessage.success(t('mcp.deleteSuccess'))
    await loadResources()
  } catch {
    ElMessage.error('Failed to delete')
  }
}

async function loadResources() {
  loading.value = true
  try {
    const res = await api.get('/admin/mcp', { params: { per: perPage.value, page: page.value } })
    const data = res.data?.data ?? {}
    resources.value = data.data ?? []
    total.value = data.total ?? 0
  } catch {
    resources.value = []
  } finally {
    loading.value = false
  }
}

onMounted(loadResources)
</script>
