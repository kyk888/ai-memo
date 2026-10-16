'use client'

import { useEffect } from 'react'
import { Memo } from '@/types/memo'
import { useMemoSummary } from '@/hooks/useMemoSummary'
import { MIN_SUMMARY_LENGTH, isMemoTooShort } from '@/utils/summaryPrompt'

interface MemoSummaryModalProps {
  memo: Memo
  onClose: () => void
}

export default function MemoSummaryModal({
  memo,
  onClose,
}: MemoSummaryModalProps) {
  const { status, summary, errorMessage, summarize } = useMemoSummary()
  const tooShort = isMemoTooShort(memo.content)

  const handleSummarize = () =>
    summarize({ title: memo.title, content: memo.content })

  // ESC 키로 요약 모달만 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      data-testid="memo-summary-backdrop"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="memo-summary-title"
        className="flex w-full max-w-md flex-col rounded-lg bg-white shadow-xl"
        onClick={e => e.stopPropagation()}
        data-testid="memo-summary-modal"
      >
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <h3
            id="memo-summary-title"
            className="text-lg font-semibold text-gray-900"
          >
            AI 요약
          </h3>
          <button
            onClick={onClose}
            aria-label="요약 닫기"
            className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
            data-testid="memo-summary-close-btn"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="min-h-32 p-6 text-sm text-gray-700">
          {tooShort && (
            <p data-testid="memo-summary-short-notice">
              메모 내용이 너무 짧아 요약할 수 없습니다. (공백 제외{' '}
              {MIN_SUMMARY_LENGTH}자 이상)
            </p>
          )}

          {!tooShort && status === 'idle' && (
            <div className="flex flex-col items-start gap-3">
              <p className="text-gray-500">
                메모 내용이 AI 서비스(Gemini)로 전송되어 요약됩니다.
              </p>
              <button
                onClick={handleSummarize}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                data-testid="memo-summary-start-btn"
              >
                요약하기
              </button>
            </div>
          )}

          {!tooShort && status === 'loading' && (
            <p
              role="status"
              className="animate-pulse text-gray-500"
              data-testid="memo-summary-loading"
            >
              요약하는 중입니다...
            </p>
          )}

          {!tooShort && status === 'success' && (
            <p
              className="whitespace-pre-wrap break-words leading-relaxed"
              data-testid="memo-summary-result"
            >
              {summary}
            </p>
          )}

          {!tooShort && status === 'error' && (
            <div className="flex flex-col items-start gap-3">
              <p
                role="alert"
                className="text-red-600"
                data-testid="memo-summary-error"
              >
                {errorMessage}
              </p>
              <button
                onClick={handleSummarize}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                data-testid="memo-summary-retry-btn"
              >
                다시 시도
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
