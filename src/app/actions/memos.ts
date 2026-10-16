'use server'

import { Memo, MemoFormData } from '@/types/memo'
import { createSupabaseClient } from '@/utils/supabase'

interface MemoRow {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  created_at: string
  updated_at: string
}

const toMemo = (row: MemoRow): Memo => ({
  id: row.id,
  title: row.title,
  content: row.content,
  category: row.category,
  tags: row.tags,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

const toRowData = (formData: MemoFormData) => ({
  title: formData.title,
  content: formData.content,
  category: formData.category,
  tags: formData.tags,
})

const fail = (message: string, error: { message: string }): never => {
  console.error(message, error.message)
  throw new Error(message)
}

export async function getMemos(): Promise<Memo[]> {
  const { data, error } = await createSupabaseClient()
    .from('memos')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) fail('메모를 불러오지 못했습니다.', error)
  return (data as MemoRow[]).map(toMemo)
}

export async function createMemo(formData: MemoFormData): Promise<Memo> {
  const { data, error } = await createSupabaseClient()
    .from('memos')
    .insert(toRowData(formData))
    .select()
    .single()

  if (error) fail('메모를 저장하지 못했습니다.', error)
  return toMemo(data as MemoRow)
}

export async function updateMemo(
  id: string,
  formData: MemoFormData
): Promise<Memo> {
  const { data, error } = await createSupabaseClient()
    .from('memos')
    .update(toRowData(formData))
    .eq('id', id)
    .select()
    .single()

  if (error) fail('메모를 수정하지 못했습니다.', error)
  return toMemo(data as MemoRow)
}

export async function deleteMemo(id: string): Promise<void> {
  const { error } = await createSupabaseClient()
    .from('memos')
    .delete()
    .eq('id', id)

  if (error) fail('메모를 삭제하지 못했습니다.', error)
}
