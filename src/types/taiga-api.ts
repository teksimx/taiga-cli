export interface AuthResponse {
  auth_token: string;
  id: number;
  username: string;
  full_name: string;
  email: string;
}

export interface TaigaUser {
  id: number;
  username: string;
  full_name: string;
  full_name_display: string;
  email: string;
  photo?: string;
}

export interface TaigaProject {
  id: number;
  name: string;
  slug: string;
  description: string;
  is_private: boolean;
  total_milestones?: number;
  total_story_points?: number;
  us_statuses?: TaigaStatus[];
  task_statuses?: TaigaStatus[];
  issue_statuses?: TaigaStatus[];
  epic_statuses?: TaigaStatus[];
  issue_types?: TaigaNamedEntity[];
  priorities?: TaigaNamedEntity[];
  severities?: TaigaNamedEntity[];
  points?: TaigaNamedEntity[];
  tags_colors?: Record<string, string | null>;
  modules?: Record<string, boolean>;
}

export interface TaigaStatus {
  id: number;
  name: string;
  slug: string;
  color: string;
  order: number;
  is_closed: boolean;
}

export interface TaigaNamedEntity {
  id: number;
  name: string;
  order: number;
  color?: string;
}

export interface WorkItem {
  id: number;
  ref: number;
  subject: string;
  description?: string;
  project: number;
  status: number;
  status_extra_info?: { name: string; color: string };
  assigned_to?: number | null;
  assigned_to_extra_info?: { full_name_display: string } | null;
  tags?: string[][];
  milestone?: number | null;
  milestone_slug?: string | null;
  is_closed?: boolean;
  created_date?: string;
  modified_date?: string;
}

export interface TaigaMilestone {
  id: number;
  name: string;
  slug: string;
  project: number;
  estimated_start?: string;
  estimated_finish?: string;
  closed: boolean;
}

export interface TaigaMembership {
  id: number;
  project: number;
  role: number;
  role_name: string;
  user: number;
  email?: string;
  username?: string;
  full_name?: string;
}

export interface TaigaRole {
  id: number;
  name: string;
  slug: string;
  project: number;
  order: number;
}

export interface TaigaAttachment {
  id: number;
  name: string;
  size: number;
  url: string;
  project: number;
}

export interface TaigaWikiPage {
  id: number;
  slug: string;
  project: number;
  content: string;
  last_modifier?: number;
  version: number;
}

export interface TaigaWikiLink {
  id: number;
  project: number;
  title: string;
  href: string;
}

export interface TaigaWebhook {
  id: number;
  project: number;
  name: string;
  url: string;
  key: string;
}

export interface TaigaHistoryEntry {
  id: string;
  type: number;
  created_at: string;
  comment?: string;
  comment_html?: string;
  user?: TaigaUser;
  values_diff?: Record<string, unknown>;
}

export interface TaigaCustomAttribute {
  id: number;
  name: string;
  project: number;
  type: string;
  order: number;
}

export type WorkItemType = "user-story" | "task" | "issue" | "epic";

export const WORK_ITEM_ENDPOINTS: Record<WorkItemType, string> = {
  "user-story": "userstories",
  task: "tasks",
  issue: "issues",
  epic: "epics",
};

export const HISTORY_TYPES: Record<WorkItemType, string> = {
  "user-story": "userstory",
  task: "task",
  issue: "issue",
  epic: "epic",
};
