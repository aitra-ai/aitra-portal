import api from './index'

export interface ModelWeightSync {
  id: number
  repo_id: number
  repo_path: string
  hf_model_id: string
  status: 'pending' | 'syncing' | 'done' | 'error'
  total_files: number
  synced_files: number
  total_size: number
  synced_size: number
  error_msg: string
  created_at: string
  updated_at: string
}

export interface SyncedFile {
  path: string
  size: number
}

export const listModelWeights = () =>
  api.get<{ msg: string; data: ModelWeightSync[] }>('/user/model-weights')

export const getWeightStatus = (repoId: number) =>
  api.get<{ msg: string; data: ModelWeightSync }>(`/user/model-weights/${repoId}/status`)

export const triggerWeightSync = (repoId: number) =>
  api.post(`/user/model-weights/${repoId}/sync`)

export const listWeightFiles = (repoId: number) =>
  api.get<{ msg: string; data: SyncedFile[] }>(`/user/model-weights/${repoId}/files`)