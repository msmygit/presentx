// Represents the overall structure stored in the 'presentations' collection
export interface Presentation {
  _id: string; // Astra DB uses _id by default, maps to presentation_id
  presentation_id: string; // Keep for clarity/consistency if needed elsewhere
  title: string;
  description?: string;
  presenter_id: string;
  access_code: string; // Unique, short code for audience access
  state: 'draft' | 'active' | 'completed';
  current_page_id?: string | null; // ID of the currently active page
  created_at: string; // ISO Date string
  updated_at: string; // ISO Date string
  ended_at?: string | null; // ISO Date string
  total_audience_estimate?: number;
  pages: Page[];
}

// Represents a single page/slide within a presentation
export interface Page {
  page_id: string; // Unique within the presentation
  page_order: number;
  page_type: PageType;
  status: 'active' | 'skipped'; // New status field
  page_title?: string;
  page_config: PageConfig; // Type-specific configuration
  audience_response_count: number; // Denormalized total responses for this page
  audience_summary: AudienceSummary; // Denormalized summary for quick display
}

// Union type for all possible page types
export type PageType =
  | 'multi-choice'
  | 'poll' // Similar to multi-choice, maybe simpler config
  | 'open-ended' // Renamed from open-text for clarity
  | 'scales' // New type
  | 'ranking' // New type
  | 'word-cloud' // Kept
  | 'q&a'; // Placeholder kept for future

// Type-specific configurations for pages
export type PageConfig =
  | MultiChoiceConfig
  | PollConfig
  | OpenEndedConfig // Renamed
  | ScalesConfig // New
  | RankingConfig // New
  | WordCloudConfig
  | QnAConfig;

export interface MultiChoiceConfig {
  question: string;
  options: string[];
  allow_multiple?: boolean;
}

export interface PollConfig {
  question: string;
  options: string[];
}

export interface OpenEndedConfig {
  question: string;
  max_length?: number;
}

export interface ScalesConfig {
  question: string;
  scale_min: number; // e.g., 1
  scale_max: number; // e.g., 5
  label_min?: string; // e.g., 'Strongly Disagree'
  label_max?: string; // e.g., 'Strongly Agree'
}

export interface RankingConfig {
  question: string;
  items: string[]; // The items to be ranked
}

export interface WordCloudConfig {
  question: string;
  max_length?: number;
}

export interface QnAConfig {
  allow_anonymous_questions?: boolean;
  allow_upvotes?: boolean;
}

// Type-specific summary data stored within the Page object
export type AudienceSummary =
  | MultiChoiceSummary
  | OpenEndedSummary // Renamed
  | ScalesSummary // New
  | RankingSummary // New
  | WordCloudSummary
  | QnASummary;

// Key is the option text, value is the count
export type MultiChoiceSummary = Record<string, number>;

export interface WordCloudSummary {
  // Store top N words, or potentially all words if feasible
  top_words?: Record<string, number>;
  // all_words?: Record<string, number>;
}

// Open ended might just store a sample of responses, or just the count
export interface OpenEndedSummary {
  response_count: number;
  sample_responses?: string[]; // Store maybe the latest N responses?
}

// New Summaries
export interface ScalesSummary {
  average?: number;
  counts: Record<string, number>; // e.g., { "1": 10, "2": 15, "3": 50, "4": 20, "5": 5 }
}

// Ranking summary could show average rank or most common rankings
export interface RankingSummary {
  item_average_ranks?: Record<string, number>; // Key is item text, value is avg rank (1 is highest)
  most_common_rankings?: { ranking: string[], count: number }[]; // E.g. [{ ranking: ['Item A', 'Item C', 'Item B'], count: 15 }]
}

// Summary for Q&A might involve counts or top questions
export interface QnASummary {
  question_count?: number;
  upvoted_questions?: { question_id: string; text: string; upvotes: number }[]; // Example
}

// Represents a single document in the 'page_responses' collection (a batch)
export interface PageResponseBatch {
  _id: string; // Astra DB default ID
  // Composite Key Fields
  presentation_id: string;
  page_id: string;
  batch_sequence: number; // 0-based index for response batches

  response_count_in_batch: number;
  is_active_batch: boolean; // Is this the current batch to write to?
  created_at: string; // ISO Date string
  responses: IndividualResponse[]; // Array capped at ~1000
}

// Represents a single audience response within a batch
export interface IndividualResponse {
  response_id: string; // Unique ID for this specific response
  user_id: string; // Identifier for the audience member (session ID, etc.)
  submitted_at: string; // ISO Date string
  response_data: any; // The actual answer (string, number, object, etc. depending on PageType)
}

// --- API Request/Response Types (Examples) ---

export interface CreatePresentationRequest {
  title: string;
  description?: string;
  presenter_id: string; // Usually inferred from auth
}

export interface AddPageRequest {
  page_order: number;
  page_type: PageType;
  page_title?: string;
  page_config: PageConfig;
}

export interface SubmitResponseRequest {
  user_id: string; // Or determined server-side
  response_data: any;
}

export interface JoinPresentationResponse {
  presentation: Presentation;
  // Potentially include WebSocket connection details/token if needed
}

// --- WebSocket Event Payloads ---

export interface PageChangeEvent {
  presentation_id: string;
  new_page_id: string | null;
}

export interface SummaryUpdateEvent {
  presentation_id: string;
  page_id: string;
  new_summary: AudienceSummary;
  new_response_count: number;
}

export interface NewQuestionEvent { // For Q&A type
  presentation_id: string;
  page_id: string;
  question: { id: string; text: string; userId: string; timestamp: string };
}

export interface AudienceCountUpdateEvent {
  presentation_id: string;
  count: number;
} 