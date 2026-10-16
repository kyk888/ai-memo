'use client'

import { useMemo } from 'react'
import dynamic from 'next/dynamic'
import '@uiw/react-markdown-preview/markdown.css'
import { rehypeHighlight } from '@/utils/highlight'
import { openExternalLinksInNewTab } from '@/utils/markdownLinks'

// 브라우저 전용 라이브러리이므로 SSR 비활성화
const MDEditorMarkdown = dynamic(
  () => import('@uiw/react-md-editor').then(mod => mod.default.Markdown),
  { ssr: false }
)

interface MarkdownViewerProps {
  source: string
  highlightQuery?: string
}

export default function MarkdownViewer({
  source,
  highlightQuery = '',
}: MarkdownViewerProps) {
  const rehypePlugins = useMemo(
    () => [rehypeHighlight(highlightQuery)],
    [highlightQuery]
  )

  return (
    <div data-color-mode="light" data-testid="markdown-viewer">
      <MDEditorMarkdown
        source={source}
        rehypePlugins={rehypePlugins}
        rehypeRewrite={openExternalLinksInNewTab}
        className="!bg-transparent !text-sm"
      />
    </div>
  )
}
