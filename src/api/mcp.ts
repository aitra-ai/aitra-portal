import api from './index'

export interface McpServer {
  id: string
  name: string
  namespace: string
  description?: string
  status?: string
  endpoint?: string
  created_at?: string
}

export interface McpResponse {
  data: McpServer[]
  total: number
}

export const listMcpServers = (page = 1, per = 20) =>
  api.get<McpResponse>('/v1/mcp/servers', { params: { page, per } })
