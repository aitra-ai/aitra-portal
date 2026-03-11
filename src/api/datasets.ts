import api from './index'

export interface Dataset {
  id: number
  name: string
  nickname?: string
  description?: string
  path: string       // "namespace/name"
  private: boolean
  likes: number
  downloads: number
  updated_at?: string
  created_at?: string
  readme?: string
  license?: string
  default_branch?: string
  repository?: {
    http_clone_url: string
    ssh_clone_url: string
  }
}

export interface CreateDatasetReq {
  namespace: string
  name: string
  nickname?: string
  description?: string
  private: boolean
  license?: string
}

export const listDatasets = (params: {
  per?: number; page?: number; sort?: string; search?: string
}) => api.get<{ data: Dataset[] | null; total: number }>('/datasets', { params })

export const getDataset = (namespace: string, name: string) =>
  api.get<{ data: Dataset }>(`/datasets/${namespace}/${name}`)

export const createDataset = (data: CreateDatasetReq) =>
  api.post<{ data: Dataset }>('/datasets', data)

export const deleteDataset = (namespace: string, name: string) =>
  api.delete(`/datasets/${namespace}/${name}`)

export interface FileEntry {
  name: string
  type: 'file' | 'dir'
  path: string
  size?: number
  last_commit?: { id: string; message: string; created_at: string }
  commit?: { id: string; message: string; created_at: string; committer_date?: string }
}

export const getDatasetTree = (namespace: string, name: string, branch = 'main') =>
  api.get<{ data: FileEntry[] | null }>(`/datasets/${namespace}/${name}/tree`, {
    params: { ref: branch }
  })

export const commitFiles = (
  namespace: string,
  name: string,
  revision: string,
  data: {
    message: string
    files: Array<{ path: string; action: 'create' | 'update' | 'delete'; content: string }>
  }
) => api.post(`/datasets/${namespace}/${name}/commit/${revision}`, data)
