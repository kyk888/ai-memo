'use client'

import { splitByQuery } from '@/utils/highlight'

interface HighlightTextProps {
  text: string
  query: string
}

// 검색어와 일치하는 부분에 배경색을 입혀 표시
export default function HighlightText({ text, query }: HighlightTextProps) {
  return (
    <>
      {splitByQuery(text, query).map((segment, index) =>
        segment.matched ? (
          <mark
            key={index}
            className="search-highlight rounded-sm bg-yellow-200 text-inherit"
          >
            {segment.text}
          </mark>
        ) : (
          <span key={index}>{segment.text}</span>
        )
      )}
    </>
  )
}
