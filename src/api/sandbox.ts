import api from './index'

export interface FeaturedSpace {
  id: number
  space_path: string
  template: string
  display_name: string
  description: string
  cover_url?: string
  hot_pool: number
  ttl_seconds: number
  enabled: boolean
  sort_order: number
  running_instances?: number
  created_at: string
}

export interface SandboxInstance {
  id: number
  space_path: string
  template: string
  username: string
  status: 'pending' | 'starting' | 'running' | 'stopped' | 'error'
  container_id?: string
  port?: number
  access_url?: string
  error_msg?: string
  is_hot_pool: boolean
  started_at?: string
  expires_at?: string
  created_at: string
}

export const listFeaturedSpaces = () =>
  api.get<{ data: FeaturedSpace[] }>('/public/sandbox/featured')

export const launchSandbox = (namespace: string, name: string) =>
  api.post<{ data: SandboxInstance | { id: number; status: string } }>(
    `/sandbox/spaces/${namespace}/${name}/launch`
  )

export const getSandboxStatus = (id: number) =>
  api.get<{ data: SandboxInstance }>(`/public/sandbox/instances/${id}/status`)

export const stopSandbox = (id: number) =>
  api.delete(`/sandbox/instances/${id}`)

export const listMySandboxes = () =>
  api.get<{ data: SandboxInstance[] }>('/sandbox/instances')

// Admin
export const adminListFeaturedSpaces = () =>
  api.get<{ data: FeaturedSpace[] }>('/admin/sandbox/featured')

export const adminCreateFeaturedSpace = (data: Partial<FeaturedSpace>) =>
  api.post('/admin/sandbox/featured', data)

export const adminUpdateFeaturedSpace = (id: number, data: Partial<FeaturedSpace>) =>
  api.put(`/admin/sandbox/featured/${id}`, data)

export const adminDeleteFeaturedSpace = (id: number) =>
  api.delete(`/admin/sandbox/featured/${id}`)

export const adminListInstances = () =>
  api.get<{ data: SandboxInstance[] }>('/admin/sandbox/instances')
