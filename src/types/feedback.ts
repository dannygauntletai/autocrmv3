export type FeedbackStatus = 'sent' | 'completed';

export interface Feedback {
  id: string;
  ticket_id: string;
  customer_id: string;
  rating: number;
  status: FeedbackStatus;
  created_at: string;
} 