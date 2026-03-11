import api from './index'

export interface GPUSku {
  id: number
  name: string
  display_name: string
  gpu_model: string
  vcpus: number
  memory_gb: number
  gpu_count: number
  price_per_hour: number
  enabled: boolean
}

export interface DeploymentWithCost {
  id: number
  user_id: number
  username: string
  deploy_name: string
  model_path: string
  sku_name: string
  price_per_hour: number
  status: 'running' | 'stopped'
  started_at: string
  stopped_at?: string
  last_billed_at: string
  total_billed_usd: number
  running_hours: number
  estimated_current_bill: number
  created_at: string
}

// Public
export const listPublicGPUSkus = () =>
  api.get<{ msg: string; data: GPUSku[] }>('/public/gpu/skus')

// User
export const listMyDeployments = () =>
  api.get<{ msg: string; data: DeploymentWithCost[] }>('/user/gpu/deployments')

export const createDeployment = (data: { deploy_name: string; model_path: string; sku_name: string }) =>
  api.post<{ msg: string; data: DeploymentWithCost }>('/user/gpu/deployments', data)

export const stopDeployment = (id: number) =>
  api.put(`/user/gpu/deployments/${id}/stop`)

export const deleteDeployment = (id: number) =>
  api.delete(`/user/gpu/deployments/${id}`)

// Admin
export const adminListGPUSkus = () =>
  api.get<{ msg: string; data: GPUSku[] }>('/admin/gpu/skus')

export const adminCreateGPUSku = (data: Omit<GPUSku, 'id'>) =>
  api.post('/admin/gpu/skus', data)

export const adminUpdateGPUSku = (id: number, data: Partial<GPUSku>) =>
  api.put(`/admin/gpu/skus/${id}`, data)

export const adminDeleteGPUSku = (id: number) =>
  api.delete(`/admin/gpu/skus/${id}`)

export const adminListDeployments = () =>
  api.get<{ msg: string; data: DeploymentWithCost[] }>('/admin/gpu/deployments')
