'use client'

import dynamic from 'next/dynamic'
import '@uiw/react-md-editor/markdown-editor.css'
import '@uiw/react-markdown-preview/markdown.css'
import { openExternalLinksInNewTab } from '@/utils/markdownLinks'

// 브라우저 전용 라이브러리이므로 SSR 비활성화
const MDEditor = dynamic(() => import('@uiw/react-md-editor'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] w-full animate-pulse rounded-lg bg-gray-100" />
  ),
})

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  height?: number
}

export default function MarkdownEditor({
  value,
  onChange,
  height = 400,
}: MarkdownEditorProps) {
  return (
    <div data-color-mode="light" data-testid="markdown-editor">
      <MDEditor
        value={value}
        onChange={newValue => onChange(newValue ?? '')}
        preview="live"
        previewOptions={{ rehypeRewrite: openExternalLinksInNewTab }}
        height={height}
        textareaProps={{ placeholder: '마크다운으로 메모 내용을 입력하세요' }}
      />
    </div>
  )
}
