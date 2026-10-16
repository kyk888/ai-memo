export interface TextSegment {
  text: string
  matched: boolean
}

// 태그 검색 시 앞에 붙은 '#'은 무시
export const stripTagPrefix = (query: string): string =>
  query.replace(/^#+/, '')

// 텍스트를 검색어 일치/불일치 구간으로 분할 (대소문자 무시)
export const splitByQuery = (text: string, query: string): TextSegment[] => {
  const keyword = query.trim().toLowerCase()
  if (!keyword) return [{ text, matched: false }]

  const lowerText = text.toLowerCase()
  const segments: TextSegment[] = []
  let cursor = 0

  while (cursor < text.length) {
    const index = lowerText.indexOf(keyword, cursor)
    if (index === -1) break
    if (index > cursor) {
      segments.push({ text: text.slice(cursor, index), matched: false })
    }
    segments.push({
      text: text.slice(index, index + keyword.length),
      matched: true,
    })
    cursor = index + keyword.length
  }

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), matched: false })
  }

  return segments
}

// rehype(hast) 노드의 최소 타입 정의
interface HastNode {
  type: string
  value?: string
  tagName?: string
  properties?: Record<string, unknown>
  children?: HastNode[]
}

const HIGHLIGHT_CLASS = 'search-highlight'

// 마크다운 렌더링 결과의 텍스트 노드에서 검색어를 <mark>로 감싸는 rehype 플러그인
export const rehypeHighlight = (query: string) => () => {
  const walk = (node: HastNode) => {
    if (!node.children) return
    const next: HastNode[] = []
    for (const child of node.children) {
      // 코드 블록(pre)은 Prism 구문 강조와 충돌하므로 건드리지 않음
      if (child.type === 'element' && child.tagName === 'pre') {
        next.push(child)
        continue
      }
      if (child.type === 'text' && child.value) {
        const segments = splitByQuery(child.value, query)
        if (segments.length === 1 && !segments[0].matched) {
          next.push(child)
          continue
        }
        for (const segment of segments) {
          next.push(
            segment.matched
              ? {
                  type: 'element',
                  tagName: 'mark',
                  properties: { className: [HIGHLIGHT_CLASS] },
                  children: [{ type: 'text', value: segment.text }],
                }
              : { type: 'text', value: segment.text }
          )
        }
      } else {
        walk(child)
        next.push(child)
      }
    }
    node.children = next
  }

  return (tree: HastNode) => {
    if (query.trim()) walk(tree)
  }
}
