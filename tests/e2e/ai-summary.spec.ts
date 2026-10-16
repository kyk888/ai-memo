import { test, expect, Page } from '@playwright/test'

const STORAGE_KEY = 'memo-app-memos'
const LONG_CONTENT =
  '이번 주 프로젝트 회의에서 다음 분기 로드맵을 논의했다. 핵심 안건은 검색 성능 개선과 모바일 UI 정리이며, 담당자와 마감일을 각각 정했다. 다음 회의 전까지 초안을 공유하기로 했다.'

const buildMemo = (id: string, title: string, content: string) => ({
  id,
  title,
  content,
  category: 'work',
  tags: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
})

const openMemo = async (page: Page, title: string, content: string) => {
  await page.addInitScript(
    ([key, memo]) => localStorage.setItem(key, JSON.stringify([memo])),
    [STORAGE_KEY, buildMemo('memo-1', title, content)] as const
  )
  await page.goto('/')
  await page.getByTestId('memo-card').first().click()
  await expect(page.getByTestId('memo-viewer')).toBeVisible()
  await page.getByTestId('memo-viewer-summary-btn').click()
  await expect(page.getByTestId('memo-summary-modal')).toBeVisible()
}

test.describe('AI 메모 요약', () => {
  test('요약 성공: 로딩 후 결과를 보여준다', async ({ page }) => {
    await page.route('**/api/summarize', async route => {
      await new Promise(resolve => setTimeout(resolve, 300))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ summary: '로드맵 회의 요약입니다.' }),
      })
    })

    await openMemo(page, '주간 회의', LONG_CONTENT)
    await page.getByTestId('memo-summary-start-btn').click()

    await expect(page.getByTestId('memo-summary-loading')).toBeVisible()
    await expect(page.getByTestId('memo-summary-result')).toHaveText(
      '로드맵 회의 요약입니다.'
    )
  })

  test('요약 실패 후 다시 시도하면 성공한다', async ({ page }) => {
    let callCount = 0
    await page.route('**/api/summarize', async route => {
      callCount += 1
      if (callCount === 1) {
        await route.fulfill({
          status: 502,
          contentType: 'application/json',
          body: JSON.stringify({ error: '요약에 실패했습니다.' }),
        })
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ summary: '재시도 성공 요약' }),
        })
      }
    })

    await openMemo(page, '주간 회의', LONG_CONTENT)
    await page.getByTestId('memo-summary-start-btn').click()

    await expect(page.getByTestId('memo-summary-error')).toHaveText(
      '요약에 실패했습니다.'
    )
    await page.getByTestId('memo-summary-retry-btn').click()
    await expect(page.getByTestId('memo-summary-result')).toHaveText(
      '재시도 성공 요약'
    )
  })

  test('너무 짧은 메모는 API를 호출하지 않고 안내만 보여준다', async ({
    page,
  }) => {
    let called = false
    await page.route('**/api/summarize', async route => {
      called = true
      await route.abort()
    })

    await openMemo(page, '짧은 메모', '짧은 내용')

    await expect(page.getByTestId('memo-summary-short-notice')).toBeVisible()
    await expect(page.getByTestId('memo-summary-start-btn')).toHaveCount(0)
    expect(called).toBe(false)
  })

  test('요약 모달에서 ESC를 누르면 요약 모달만 닫힌다', async ({ page }) => {
    await openMemo(page, '주간 회의', LONG_CONTENT)

    await page.keyboard.press('Escape')

    await expect(page.getByTestId('memo-summary-modal')).toHaveCount(0)
    await expect(page.getByTestId('memo-viewer')).toBeVisible()
  })

  test('요약 모달 배경을 클릭해도 상세보기는 유지된다', async ({ page }) => {
    await openMemo(page, '주간 회의', LONG_CONTENT)

    await page
      .getByTestId('memo-summary-backdrop')
      .click({ position: { x: 5, y: 5 } })

    await expect(page.getByTestId('memo-summary-modal')).toHaveCount(0)
    await expect(page.getByTestId('memo-viewer')).toBeVisible()
  })
})
