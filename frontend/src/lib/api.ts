import axios from 'axios'

const BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000'

const api = axios.create({ baseURL: BASE_URL })

export type QueryResult =
  | { columns: string[]; rows: any[]; rowCount: number; elapsedMs: number }
  | { message: string; rowCount: number; elapsedMs: number }

export type TableInfo = { columns: { name: string; type: string }[]; sample: any[] }

export async function getTables(): Promise<string[]> {
  try {
    const { data } = await api.get(`/api/tables`)
    return data.tables as string[]
  } catch (e: any) {
    const detail = e?.response?.data?.detail || e?.message || 'Failed to load tables'
    throw new Error(detail)
  }
}

export async function getTableInfo(name: string): Promise<TableInfo> {
  try {
    const { data } = await api.get(`/api/tables/${encodeURIComponent(name)}`)
    return data as TableInfo
  } catch (e: any) {
    const detail = e?.response?.data?.detail || e?.message || 'Failed to load table info'
    throw new Error(detail)
  }
}

export async function runQuery(query: string): Promise<QueryResult> {
  try {
    const { data } = await api.post(`/api/query`, { query })
    return data as QueryResult
  } catch (e: any) {
    const detail = e?.response?.data?.detail || e?.message || 'Query failed'
    throw new Error(detail)
  }
}

export const _internal = { BASE_URL }
