/** Mirrors the `ai_tasks` table. Records AI jobs; no AI provider is connected yet. */
export const AI_TASK_TYPES = [
  'description_generation',
  'category_suggestion',
  'review_summary',
  'image_tagging',
  'search_ranking',
] as const;
export const AI_TASK_STATUSES = ['queued', 'running', 'succeeded', 'failed'] as const;

export type AiTaskType = (typeof AI_TASK_TYPES)[number];
export type AiTaskStatus = (typeof AI_TASK_STATUSES)[number];

export interface AiTask {
  id: string;
  task_type: AiTaskType;
  status: AiTaskStatus;
  business_id: string | null;
  requested_by: string | null;
  input: Record<string, unknown>;
  output: Record<string, unknown> | null;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}
