import type { MarkdownPreviewProps } from '@uiw/react-markdown-preview'

type RehypeRewrite = NonNullable<MarkdownPreviewProps['rehypeRewrite']>

// 외부 링크는 새 탭에서 열어 메모 앱(작성 중인 폼 포함)을 벗어나지 않도록 함
export const openExternalLinksInNewTab: RehypeRewrite = node => {
  if (node.type !== 'element' || node.tagName !== 'a') return
  const href = node.properties?.href
  if (typeof href === 'string' && /^https?:\/\//.test(href)) {
    node.properties = {
      ...node.properties,
      target: '_blank',
      rel: ['noopener', 'noreferrer'],
    }
  }
}
