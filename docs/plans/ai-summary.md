# AI 메모 요약 기능 계획

> 상태: 초안 (deep-interview 결과 기반)

## 1. 목표

메모 상세보기(`MemoViewer`)에서 버튼을 누르면 모달이 열리고, 그 안에서 Gemini로 메모를 짧게 요약해 보여준다.

## 2. 확정 요구사항

| 항목 | 결정 |
|------|------|
| 모델 | Gemini Flash-Lite 계열 (정확한 모델 ID는 열린 질문 1 참고) |
| 호출 위치 | Next.js API Route (서버). 브라우저는 키를 알지 못한다 |
| API 키 | `.env.local`의 `GEMINI_API_KEY` (`.gitignore`의 `.env*`로 커밋 제외됨) |
| 트리거 | `MemoViewer`의 액션 영역 버튼 -> 요약 모달 |
| 결과 처리 | 모달에서 읽기 전용. 저장하지 않음 (`Memo` 타입, LocalStorage 변경 없음) |
| 요약 형태 | 2~3문장 한국어 요약 한 덩어리 |
| 로딩 | 모달 안에 로딩 표시 |
| 실패 | 한국어 에러 메시지 + 재시도 버튼 |
| 짧은 메모 | API 호출 없이 안내 문구만 표시 |

### 제외 범위

- 요약 저장 / 캐싱, 복사, 본문 삽입
- 불릿 등 다른 요약 형식
- 스트리밍 응답

## 3. 현재 코드 상황 (확인한 사실)

- `MemoViewer.tsx`가 이미 `fixed inset-0 z-40` 모달이다. 요약 모달은 그 위에 겹치는 **중첩 모달**이 된다.
- `MemoViewer`의 ESC 핸들러가 `document`에 걸려 있어, 요약 모달에서 ESC를 누르면 두 모달이 함께 닫힌다. 요약 모달이 열려 있는 동안에는 상세보기의 ESC/배경 클릭 닫기를 막아야 한다.
- `src/app/api/`, AI SDK 의존성, `tests/` 디렉토리가 모두 없다. 모두 새로 만든다.
- `playwright.config.ts`의 `testDir`은 `./tests`이며 chromium, firefox, webkit 3개 프로젝트를 쓴다.
- `package.json`은 Next 16.2.9인데 `AGENTS.md`/`src/app/AGENTS.md`는 Next 15라고 적혀 있다. 문서 불일치이므로 작업 후 갱신을 제안한다.

## 4. 설계

### 4.1 파일 구성

```
src/
├── app/api/summarize/route.ts     # POST /api/summarize
├── components/MemoSummaryModal.tsx # 요약 모달 (로딩/성공/실패/짧은 메모)
├── hooks/useMemoSummary.ts         # 요청 상태 관리 (idle/loading/success/error)
├── types/summary.ts                # 요청/응답 타입
└── utils/summaryPrompt.ts          # 짧은 메모 판정, 프롬프트 생성, 마크다운 정제
tests/e2e/ai-summary.spec.ts
```

수정: `MemoViewer.tsx` (버튼, 모달 상태, ESC/배경 클릭 처리), 각 `AGENTS.md` (파일 목록 갱신).

### 4.2 API 계약

`POST /api/summarize`

- 요청: `{ title: string, content: string }`
- 성공 200: `{ summary: string }`
- 실패: `{ error: string }` + 상태 코드
  - 400: 본문 누락 / 너무 짧음 / 너무 김
  - 500: `GEMINI_API_KEY` 누락 (사용자에게는 일반 메시지, 상세는 서버 로그에만)
  - 502: Gemini 호출 실패 / 빈 응답
- 서버에서도 짧은 메모를 검증한다 (클라이언트 검증만 믿지 않는다).
- 키는 응답, 로그, 에러 메시지 어디에도 포함하지 않는다.

### 4.3 Gemini 호출

- 의존성 `@google/genai` 사용을 우선 검토하고, 구현 전에 context7로 최신 문서를 확인한다.
- 프롬프트: 시스템 지시로 "한국어, 2~3문장, 원문에 없는 내용 추가 금지"를 지정한다. 메모 본문은 지시와 분리해 사용자 입력으로만 전달한다 (프롬프트 인젝션 완화).
- 서버 코드에서는 `console.error`만 허용한다 (AGENTS.md: `console.log` 금지, 에러 로깅 제외).

### 4.4 UI 동작

1. `MemoViewer` 액션 영역에 "AI 요약" 버튼 추가 (`data-testid="memo-viewer-summary-btn"`).
2. 클릭 -> `MemoSummaryModal` 오픈 (`z-50`, 상세보기보다 위).
3. 상태별 표시:
   - 짧은 메모: 호출하지 않고 안내 문구
   - loading: 로딩 표시
   - success: 요약 텍스트
   - error: 한국어 메시지 + "다시 시도" 버튼
4. 닫기: ESC, 배경 클릭, 닫기 버튼. 닫으면 요약은 사라지고 다시 열면 새로 요청한다.
5. 요청 중 모달을 닫으면 `AbortController`로 요청을 취소한다 (재시도 중복 클릭도 막는다).

### 4.5 `data-testid`

`memo-viewer-summary-btn`, `memo-summary-modal`, `memo-summary-loading`, `memo-summary-result`, `memo-summary-error`, `memo-summary-retry-btn`, `memo-summary-short-notice`, `memo-summary-close-btn`

## 5. 구현 순서

1. context7로 Gemini SDK 문서와 모델 ID 확인, `.env.local` 안내 추가 (`README.md`)
2. `types/summary.ts`, `utils/summaryPrompt.ts`
3. `app/api/summarize/route.ts`
4. `hooks/useMemoSummary.ts`
5. `components/MemoSummaryModal.tsx`
6. `MemoViewer.tsx` 연동 (ESC/배경 클릭 충돌 처리 포함)
7. E2E 테스트 작성
8. `lint`, `build`, `test` 실행
9. Playwright MCP로 실제 Gemini 호출 확인 후 시나리오별 결과 보고
10. `AGENTS.md` 갱신 제안

## 6. 완료 기준

- [ ] E2E (API 응답 mock): 성공, 로딩, 실패 후 재시도 성공, 짧은 메모 안내
- [ ] E2E: 요약 모달에서 ESC를 누르면 요약 모달만 닫히고 상세보기는 유지됨
- [ ] 실제 Gemini 호출 1회를 Playwright MCP로 확인해 결과를 보고함
- [ ] `npm run lint`, `npm run build` 통과
- [ ] 브라우저 번들과 네트워크 요청에서 API 키가 노출되지 않음
- [ ] TypeScript strict 위반, `any` 사용 없음

## 7. 위험과 대응

| 위험 | 대응 |
|------|------|
| 요약 모달 ESC가 상세보기까지 닫음 | 요약 모달 오픈 중 상세보기 핸들러 비활성화 |
| 키 누락/오타 | 500 응답 + 서버 로그, UI에는 일반 에러 메시지 |
| 모델 ID 오류 | 구현 첫 단계에서 문서로 확인 |
| 비용/남용 (로컬 사용이라 낮음) | 본문 길이 상한, 요청 중 중복 호출 방지 |
| 메모에 민감 정보 포함 | 버튼 클릭 시에만 외부 전송 (자동 요약 금지) |

## 8. 열린 질문

1. 정확한 모델 ID (`gemini03.1-flash-lite`가 실제 API 모델명과 일치하는지)
2. "너무 짧은 메모" 기준 글자 수 (임시값 50자)
3. 모달 오픈 시 자동 요약 vs 모달 안 버튼 클릭. 이 문서는 비용과 프라이버시 면에서 안전한 **모달 안 버튼 클릭** 방식을 기본으로 가정한다. 4.4와 E2E 시나리오는 이 방식이면 "버튼 클릭 -> 요약 시작" 단계가 하나 추가된다
4. 마크다운 정제 여부 (임시: 원문 그대로 전달)
5. 본문 길이 상한 (임시: 10,000자 초과 시 400)
