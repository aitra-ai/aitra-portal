<template>
  <div class="p-6 space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-bold text-gray-900">🚀 Spaces 沙盒管理</h1>
      <el-button type="primary" @click="showCreateDialog = true">+ 添加 Featured Space</el-button>
    </div>

    <!-- Featured Spaces 列表 -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <h2 class="text-base font-semibold text-gray-800 mb-4">Featured Spaces</h2>
      <div v-if="spacesLoading"><el-skeleton :rows="4" animated /></div>
      <el-table v-else :data="featuredSpaces" class="w-full" stripe>
        <el-table-column prop="display_name" label="名称" min-width="140" />
        <el-table-column prop="space_path" label="路径" min-width="180">
          <template #default="{ row }">
            <span class="font-mono text-sm">{{ row.space_path }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="template" label="模板" width="140">
          <template #default="{ row }">
            <el-tag size="small">{{ row.template }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="hot_pool" label="热池大小" width="90" align="center" />
        <el-table-column prop="ttl_seconds" label="TTL" width="90" align="center">
          <template #default="{ row }">{{ formatTTL(row.ttl_seconds) }}</template>
        </el-table-column>
        <el-table-column prop="enabled" label="启用" width="80" align="center">
          <template #default="{ row }">
            <el-switch :model-value="row.enabled" disabled />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" align="center">
          <template #default="{ row }">
            <el-button size="small" text @click="deleteSpace(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 运行中的实例 -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-base font-semibold text-gray-800">运行中的沙盒实例</h2>
        <el-button size="small" @click="loadInstances">刷新</el-button>
      </div>
      <div v-if="instancesLoading"><el-skeleton :rows="4" animated /></div>
      <el-empty v-else-if="instances.length === 0" description="暂无运行实例" />
      <el-table v-else :data="instances" stripe>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="space_path" label="Space" min-width="150" />
        <el-table-column prop="username" label="用户" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="port" label="端口" width="80" align="center" />
        <el-table-column prop="is_hot_pool" label="热池" width="70" align="center">
          <template #default="{ row }">
            <span>{{ row.is_hot_pool ? '🔥' : '👤' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="access_url" label="访问地址" min-width="180">
          <template #default="{ row }">
            <a v-if="row.access_url" :href="row.access_url" target="_blank"
               class="text-blue-500 hover:underline text-xs font-mono">{{ row.access_url }}</a>
          </template>
        </el-table-column>
        <el-table-column prop="expires_at" label="到期" width="130">
          <template #default="{ row }">
            <span class="text-xs text-gray-500">{{ formatTime(row.expires_at) }}</span>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 创建 Dialog -->
    <el-dialog v-model="showCreateDialog" title="添加 Featured Space" width="500px">
      <el-form :model="createForm" label-width="100px">
        <el-form-item label="Space 路径" required>
          <el-input v-model="createForm.space_path" placeholder="e.g. opencsg/openclaw-demo" />
        </el-form-item>
        <el-form-item label="显示名称">
          <el-input v-model="createForm.display_name" placeholder="OpenClaw Demo" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="createForm.description" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="模板" required>
          <el-select v-model="createForm.template" style="width:100%">
            <el-option label="openclaw-local (本地 nginx, 无需镜像)" value="openclaw-local" />
            <el-option label="openclaw (OpenClaw Demo)" value="openclaw" />
            <el-option label="gradio-demo" value="gradio-demo" />
            <el-option label="jupyter" value="jupyter" />
          </el-select>
        </el-form-item>
        <el-form-item label="热池大小">
          <el-input-number v-model="createForm.hot_pool" :min="0" :max="10" />
          <span class="text-xs text-gray-400 ml-2">预热容器数（0=按需启动）</span>
        </el-form-item>
        <el-form-item label="TTL (秒)">
          <el-input-number v-model="createForm.ttl_seconds" :min="60" :max="86400" :step="60" />
          <span class="text-xs text-gray-400 ml-2">1800=30分钟</span>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="createForm.sort_order" :min="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" :loading="creating" @click="createSpace">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  adminListFeaturedSpaces,
  adminCreateFeaturedSpace,
  adminDeleteFeaturedSpace,
  adminListInstances,
  type FeaturedSpace,
  type SandboxInstance,
} from '../api/sandbox'

const featuredSpaces = ref<FeaturedSpace[]>([])
const instances = ref<SandboxInstance[]>([])
const spacesLoading = ref(false)
const instancesLoading = ref(false)
const showCreateDialog = ref(false)
const creating = ref(false)

const createForm = ref({
  space_path: '',
  display_name: '',
  description: '',
  template: 'openclaw-local',
  hot_pool: 1,
  ttl_seconds: 1800,
  sort_order: 0,
  enabled: true,
})

onMounted(() => {
  loadSpaces()
  loadInstances()
})

async function loadSpaces() {
  spacesLoading.value = true
  try {
    const res = await adminListFeaturedSpaces()
    featuredSpaces.value = (res.data as any)?.data ?? []
  } finally {
    spacesLoading.value = false
  }
}

async function loadInstances() {
  instancesLoading.value = true
  try {
    const res = await adminListInstances()
    instances.value = (res.data as any)?.data ?? []
  } finally {
    instancesLoading.value = false
  }
}

async function createSpace() {
  creating.value = true
  try {
    await adminCreateFeaturedSpace(createForm.value)
    ElMessage.success('创建成功，热池预热中...')
    showCreateDialog.value = false
    await loadSpaces()
    resetForm()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.msg || '创建失败')
  } finally {
    creating.value = false
  }
}

async function deleteSpace(id: number) {
  await ElMessageBox.confirm('确认删除此 Featured Space？', '确认', { type: 'warning' })
  await adminDeleteFeaturedSpace(id)
  ElMessage.success('已删除')
  await loadSpaces()
}

function resetForm() {
  createForm.value = {
    space_path: '',
    display_name: '',
    description: '',
    template: 'openclaw-local',
    hot_pool: 1,
    ttl_seconds: 1800,
    sort_order: 0,
    enabled: true,
  }
}

function statusTagType(status: string): '' | 'success' | 'warning' | 'info' | 'danger' {
  const map: Record<string, '' | 'success' | 'warning' | 'info' | 'danger'> = {
    running: 'success',
    starting: 'warning',
    stopped: 'info',
    error: 'danger',
    pending: '',
  }
  return map[status] ?? ''
}

function formatTTL(seconds: number) {
  if (seconds >= 3600) return `${Math.floor(seconds / 3600)}h`
  return `${Math.floor(seconds / 60)}min`
}

function formatTime(s?: string) {
  if (!s) return '-'
  return s.replace('T', ' ').slice(0, 16)
}
</script>
