'use server'

import { GoogleGenAI } from '@google/genai'
import type {
  SummarizeErrorResponse,
  SummarizeRequest,
  SummarizeSuccessResponse,
} from '@/types/summary'
import {
  SUMMARY_SYSTEM_INSTRUCTION,
  buildSummaryContents,
  isMemoTooLong,
  isMemoTooShort,
} from '@/utils/summaryPrompt'

const DEFAULT_MODEL = 'gemini-3.1-flash-lite'

const failure = (error: string): SummarizeErrorResponse => ({ error })

export async function summarizeMemo(
  payload: SummarizeRequest
): Promise<SummarizeSuccessResponse | SummarizeErrorResponse> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.error('GEMINI_API_KEY 환경변수가 설정되지 않았습니다.')
    return failure('AI 요약 기능을 사용할 수 없습니다.')
  }

  const { title, content } = payload ?? {}
  if (typeof title !== 'string' || typeof content !== 'string') {
    return failure('잘못된 요청입니다.')
  }
  if (isMemoTooShort(content)) {
    return failure('요약하기에는 메모 내용이 너무 짧습니다.')
  }
  if (isMemoTooLong(content)) {
    return failure('메모 내용이 너무 길어 요약할 수 없습니다.')
  }

  try {
    const ai = new GoogleGenAI({ apiKey })
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || DEFAULT_MODEL,
      contents: buildSummaryContents(title, content),
      config: { systemInstruction: SUMMARY_SYSTEM_INSTRUCTION },
    })

    const summary = response.text?.trim()
    if (!summary) {
      console.error('Gemini 응답이 비어 있습니다.')
      return failure('요약 결과를 받지 못했습니다.')
    }

    return { summary }
  } catch (error) {
    // 키가 포함될 수 있는 원본 객체 대신 메시지만 기록
    console.error(
      'Gemini 요약 호출 실패:',
      error instanceof Error ? error.message : 'unknown error'
    )
    return failure('요약에 실패했습니다.')
  }
}
