import api from './index'

export interface Deployment {
  id: number
  deploy_name: string
  model_id: string
  status: number  // 0=pending, 1=running, 2=stopped, 3=failed, 4=sleeping
  endpoint: string
  runtime_framework_id: number
  min_replica: number
  max_replica: number
  created_at: string
  namespace?: string
  repo_path?: string
}

export interface RuntimeFramework {
  id: number
  frame_name: string
  frame_version: string
  deploy_type: number
}

export interface ModelSearchResult {
  path: string   // "namespace/name"
  name: string
  nickname?: string
}

// Status mapping
export const DEPLOY_STATUS: Record<number, { label: string; type: 'success'|'warning'|'info'|'danger' }> = {
  0: { label: 'deployments.status.pending', type: 'warning' },
  1: { label: 'deployments.status.running', type: 'success' },
  2: { label: 'deployments.status.stopped', type: 'info' },
  3: { label: 'deployments.status.failed', type: 'danger' },
  4: { label: 'deployments.status.pending', type: 'warning' },
  5: { label: 'deployments.status.pending', type: 'warning' },
}

// User deployments
export const getUserDeployments = (username: string) =>
  api.get<{ data: Deployment[] }>(`/user/${username}/run/model`)

// Create deployment
export const createDeployment = (namespace: string, name: string, data: {
  deploy_name: string
  runtime_framework_id: number
  min_replica: number
  max_replica: number
}) => api.post<{ data: Deployment }>(`/models/${namespace}/${name}/run`, data)

// Deployment actions
export const startDeployment = (namespace: string, name: string, id: number) =>
  api.put(`/models/${namespace}/${name}/run/${id}/start`)

export const stopDeployment = (namespace: string, name: string, id: number) =>
  api.put(`/models/${namespace}/${name}/run/${id}/stop`)

export const deleteDeployment = (namespace: string, name: string, id: number) =>
  api.delete(`/models/${namespace}/${name}/run/${id}`)

export const getDeploymentStatus = (namespace: string, name: string, id: number) =>
  api.get<{ data: { status: number; endpoint: string } }>(`/models/${namespace}/${name}/run/${id}/status`)

// Runtime frameworks
export const getRuntimeFrameworks = (deployType = 1) =>
  api.get<{ data: RuntimeFramework[] }>(`/runtime_framework?deploy_type=${deployType}`)

// Search models
export const searchModels = (search: string) =>
  api.get<{ data: ModelSearchResult[] }>(`/models?search=${encodeURIComponent(search)}&per=20&page=1`)

// Serverless (admin - platform services)
export const createServerlessService = (namespace: string, name: string, data: {
  deploy_name: string
  runtime_framework_id: number
  resource_id?: number
  min_replica: number
  max_replica: number
  engine_args?: string
  cluster_id?: string
}) => api.post(`/models/${namespace}/${name}/serverless`, data)

export const getServerlessService = (namespace: string, name: string) =>
  api.get(`/models/${namespace}/${name}/serverless`)

export const stopServerless = (namespace: string, name: string, id: number) =>
  api.put(`/models/${namespace}/${name}/serverless/${id}/stop`)

export const startServerless = (namespace: string, name: string, id: number) =>
  api.put(`/models/${namespace}/${name}/serverless/${id}/start`)
