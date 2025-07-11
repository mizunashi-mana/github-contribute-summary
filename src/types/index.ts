export interface PullRequest {
  id: number;
  number: number;
  title: string;
  state: string;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  merged_at: string | null;
  user: {
    login: string;
    id: number;
  };
  assignees: Array<{
    login: string;
    id: number;
  }>;
  requested_reviewers: Array<{
    login: string;
    id: number;
  }>;
  labels: Array<{
    name: string;
    color: string;
  }>;
  html_url: string;
}

export interface Review {
  id: number;
  user: {
    login: string;
    id: number;
  };
  body: string | null;
  state: string;
  submitted_at: string;
  pull_request_url: string;
}

export interface PullRequestWithReviews extends PullRequest {
  reviews: Review[];
  review_started_at?: string;
  review_approved_at?: string;
}

export interface ContributeData {
  created_prs: PullRequestWithReviews[];
  reviewed_prs: PullRequestWithReviews[];
  cached?: boolean;
}

// Database row interfaces
export interface PullRequestRow {
  id: number;
  number: number;
  title: string;
  state: string;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  merged_at: string | null;
  user_login: string;
  user_id: number;
  html_url: string;
  repository: string;
}

export interface ReviewRow {
  id: number;
  pr_id: number;
  user_login: string;
  user_id: number;
  body: string | null;
  state: string;
  submitted_at: string;
  repository: string;
}

export interface ReviewIdRow {
  pr_id: number;
}
