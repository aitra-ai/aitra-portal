<template>
  <div class="p-6 max-w-5xl mx-auto">
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">{{ t('skills.title') }}</h1>
        <p class="text-gray-500 mt-1">{{ t('skills.subtitle') }}</p>
      </div>
      <el-button type="primary" @click="openAddDialog">{{ t('skills.addSkill') }}</el-button>
    </div>

    <!-- Skills Table -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200">
      <el-table :data="skills" v-loading="loading" stripe>
        <el-table-column width="60">
          <template #default="{ row }">
            <span class="text-xl">{{ row.icon }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="name" :label="t('skills.name')" width="180" />
        <el-table-column prop="description" :label="t('skills.description')" min-width="200" show-overflow-tooltip />
        <el-table-column prop="preferred_model" :label="t('skills.preferredModel')" width="180" show-overflow-tooltip />
        <el-table-column :label="t('skills.builtin')" width="80">
          <template #default="{ row }">
            <el-tag v-if="row.is_builtin" size="small" type="info">{{ t('skills.builtin') }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('skills.enabled')" width="80">
          <template #default="{ row }">
            <el-tag :type="row.enabled ? 'success' : 'danger'" size="small">
              {{ row.enabled ? t('skills.enabled') : t('skills.disabled') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="t('common.actions')" width="150">
          <template #default="{ row }">
            <el-button text size="small" @click="openEditDialog(row)">{{ t('skills.editSkill') }}</el-button>
            <el-button text size="small" type="danger" @click="deleteSkill(row)">{{ t('common.delete') }}</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- Add/Edit Dialog -->
    <el-dialog v-model="dialogVisible" :title="isAdding ? t('skills.addSkill') : t('skills.editSkill')" width="560px">
      <el-form :model="form" label-position="top">
        <div class="flex gap-3">
          <el-form-item :label="t('skills.icon')" class="!w-20">
            <el-input v-model="form.icon" maxlength="4" class="text-center" />
          </el-form-item>
          <el-form-item :label="t('skills.name')" class="flex-1" required>
            <el-input v-model="form.name" />
          </el-form-item>
        </div>
        <el-form-item :label="t('skills.description')">
          <el-input v-model="form.description" />
        </el-form-item>
        <el-form-item :label="t('skills.systemPrompt')" required>
          <el-input v-model="form.system_prompt" type="textarea" :rows="5" />
        </el-form-item>
        <el-form-item :label="t('skills.preferredModel')">
          <el-input v-model="form.preferred_model" placeholder="e.g. claude-sonnet-4-20250514" />
        </el-form-item>
        <div class="flex items-center gap-3">
          <span class="text-sm text-gray-700">{{ t('skills.enabled') }}</span>
          <el-switch v-model="form.enabled" />
        </div>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ t('apikeys.cancel') }}</el-button>
        <el-button type="primary" :loading="saving" @click="saveSkill">{{ t('rateLimit.save') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '../api/index'

const { t } = useI18n()

interface AISkill {
  id: number
  name: string
  description: string
  system_prompt: string
  preferred_model: string
  icon: string
  is_builtin: boolean
  enabled: boolean
}

const skills = ref<AISkill[]>([])
const loading = ref(false)
const saving = ref(false)
const dialogVisible = ref(false)
const isAdding = ref(true)
const editingId = ref<number | null>(null)

const form = ref({
  name: '',
  description: '',
  system_prompt: '',
  preferred_model: '',
  icon: '🤖',
  enabled: true,
})

async function fetchSkills() {
  loading.value = true
  try {
    const res = await api.get<{ data: AISkill[] }>('/admin/skills')
    skills.value = res.data?.data ?? []
  } catch {
    skills.value = []
  } finally {
    loading.value = false
  }
}

function openAddDialog() {
  isAdding.value = true
  editingId.value = null
  form.value = { name: '', description: '', system_prompt: '', preferred_model: '', icon: '🤖', enabled: true }
  dialogVisible.value = true
}

function openEditDialog(skill: AISkill) {
  isAdding.value = false
  editingId.value = skill.id
  form.value = {
    name: skill.name,
    description: skill.description,
    system_prompt: skill.system_prompt,
    preferred_model: skill.preferred_model,
    icon: skill.icon,
    enabled: skill.enabled,
  }
  dialogVisible.value = true
}

async function saveSkill() {
  if (!form.value.name || !form.value.system_prompt) {
    ElMessage.warning('Name and System Prompt are required')
    return
  }
  saving.value = true
  try {
    if (isAdding.value) {
      await api.post('/admin/skills', form.value)
    } else {
      await api.put(`/admin/skills/${editingId.value}`, form.value)
    }
    ElMessage.success(t('skills.saved'))
    dialogVisible.value = false
    await fetchSkills()
  } catch {
    ElMessage.error('Failed to save')
  } finally {
    saving.value = false
  }
}

async function deleteSkill(skill: AISkill) {
  await ElMessageBox.confirm(t('skills.deleteConfirm', { name: skill.name }), t('common.confirm'))
  try {
    await api.delete(`/admin/skills/${skill.id}`)
    ElMessage.success(t('skills.deleted'))
    await fetchSkills()
  } catch {
    ElMessage.error('Failed to delete')
  }
}

onMounted(fetchSkills)
</script>
