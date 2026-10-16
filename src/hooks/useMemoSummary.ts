'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { summarizeMemo } from '@/app/actions/summarize'
import type { SummarizeRequest, SummaryStatus } from '@/types/summary'

const DEFAULT_ERROR_MESSAGE = '요약에 실패했습니다. 다시 시도해 주세요.'

export function useMemoSummary() {
  const [status, setStatus] = useState<SummaryStatus>('idle')
  const [summary, setSummary] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const requestIdRef = useRef(0)

  // 서버 액션은 중단할 수 없으므로 진행 중인 요청의 결과를 무시한다
  const cancel = useCallback(() => {
    requestIdRef.current += 1
  }, [])

  const summarize = useCallback(async (payload: SummarizeRequest) => {
    const requestId = ++requestIdRef.current

    setStatus('loading')
    setSummary('')
    setErrorMessage('')

    try {
      const data = await summarizeMemo(payload)
      if (requestId !== requestIdRef.current) return

      if ('error' in data) {
        setErrorMessage(data.error)
        setStatus('error')
        return
      }

      setSummary(data.summary)
      setStatus('success')
    } catch {
      if (requestId !== requestIdRef.current) return
      setErrorMessage(DEFAULT_ERROR_MESSAGE)
      setStatus('error')
    }
  }, [])

  // 언마운트(모달 닫힘) 시 진행 중인 요청 결과 무시
  useEffect(() => cancel, [cancel])

  return { status, summary, errorMessage, summarize }
}
