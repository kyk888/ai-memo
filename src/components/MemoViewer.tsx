'use client'

import { useEffect, useState } from 'react'
import { Memo, MEMO_CATEGORIES } from '@/types/memo'
import { stripTagPrefix } from '@/utils/highlight'
import MarkdownViewer from './MarkdownViewer'
import HighlightText from './HighlightText'
import MemoSummaryModal from './MemoSummaryModal'

interface MemoViewerProps {
  memo: Memo | null
  searchQuery: string
  onClose: () => void
  onEdit: (memo: Memo) => void
  onDelete: (id: string) => void
}

const CATEGORY_COLORS: Record<string, string> = {
  personal: 'bg-blue-100 text-blue-800',
  work: 'bg-green-100 text-green-800',
  study: 'bg-purple-100 text-purple-800',
  idea: 'bg-yellow-100 text-yellow-800',
  other: 'bg-gray-100 text-gray-800',
}

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

export default function MemoViewer({
  memo,
  searchQuery,
  onClose,
  onEdit,
  onDelete,
}: MemoViewerProps) {
  const isOpen = memo !== null
  const [isSummaryOpen, setIsSummaryOpen] = useState(false)

  // ESC 키로 닫기 (요약 모달이 열려 있는 동안에는 요약 모달이 처리)
  useEffect(() => {
    if (!isOpen || isSummaryOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isSummaryOpen, onClose])

  // 상세보기가 닫히거나 다른 메모로 바뀌면 요약 모달도 닫는다
  const memoId = memo?.id
  useEffect(() => {
    setIsSummaryOpen(false)
  }, [memoId])

  if (!memo) return null

  const handleDelete = () => {
    if (window.confirm('정말로 이 메모를 삭제하시겠습니까?')) {
      onDelete(memo.id)
      onClose()
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4"
        onClick={onClose}
        data-testid="memo-viewer-backdrop"
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="memo-viewer-title"
          className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-lg bg-white shadow-xl"
          onClick={e => e.stopPropagation()}
          data-testid="memo-viewer"
        >
          {/* 헤더 */}
          <div className="flex items-start justify-between gap-4 border-b border-gray-200 p-6">
            <div className="min-w-0 flex-1">
              <h2
                id="memo-viewer-title"
                className="mb-2 break-words text-xl font-semibold text-gray-900"
              >
                <HighlightText text={memo.title} query={searchQuery} />
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2 py-1 text-xs font-medium ${CATEGORY_COLORS[memo.category] ?? CATEGORY_COLORS.other}`}
                >
                  {MEMO_CATEGORIES[
                    memo.category as keyof typeof MEMO_CATEGORIES
                  ] || memo.category}
                </span>
                <span className="text-xs text-gray-500">
                  수정: {formatDate(memo.updatedAt)}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="닫기"
              className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
              data-testid="memo-viewer-close-btn"
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

          {/* 본문 */}
          <div className="flex-1 overflow-y-auto p-6">
            <MarkdownViewer
              source={memo.content}
              highlightQuery={searchQuery}
            />

            {memo.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {memo.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600"
                  >
                    #
                    <HighlightText
                      text={tag}
                      query={stripTagPrefix(searchQuery)}
                    />
                  </span>
                ))}
              </div>
            )}

            <p className="mt-6 text-xs text-gray-500">
              작성: {formatDate(memo.createdAt)}
            </p>
          </div>

          {/* 액션 버튼 */}
          <div className="flex justify-end gap-2 border-t border-gray-200 p-4">
            <button
              onClick={() => setIsSummaryOpen(true)}
              className="mr-auto rounded-lg border border-blue-200 px-4 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50"
              data-testid="memo-viewer-summary-btn"
            >
              AI 요약
            </button>
            <button
              onClick={handleDelete}
              className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
              data-testid="memo-viewer-delete-btn"
            >
              삭제
            </button>
            <button
              onClick={() => onEdit(memo)}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              data-testid="memo-viewer-edit-btn"
            >
              편집
            </button>
          </div>
        </div>
      </div>
      {isSummaryOpen && (
        <MemoSummaryModal memo={memo} onClose={() => setIsSummaryOpen(false)} />
      )}
    </>
  )
}
