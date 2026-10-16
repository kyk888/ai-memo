export interface SummarizeRequest {
  title: string
  content: string
}

export interface SummarizeSuccessResponse {
  summary: string
}

export interface SummarizeErrorResponse {
  error: string
}

export type SummaryStatus = 'idle' | 'loading' | 'success' | 'error'
