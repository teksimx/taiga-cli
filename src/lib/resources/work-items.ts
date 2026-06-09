import { ResourceClient } from "./base.js";
import type { TaigaClient } from "../client.js";
import type { WorkItem, WorkItemType } from "../../types/taiga-api.js";
import { WORK_ITEM_ENDPOINTS } from "../../types/taiga-api.js";

export function createWorkItemResource(client: TaigaClient, type: WorkItemType) {
  return new ResourceClient<WorkItem>(client, {
    endpoint: WORK_ITEM_ENDPOINTS[type],
    supportsRef: true,
  });
}

export class UserStoriesResource extends ResourceClient<WorkItem> {
  constructor(client: TaigaClient) {
    super(client, { endpoint: "userstories", supportsRef: true });
  }

  filtersData(projectId: number): Promise<Record<string, unknown>> {
    return this.client.get("userstories/filters_data", { project: projectId });
  }

  bulkUpdateMilestone(projectId: number, refs: number[], milestoneId: number): Promise<unknown> {
    return this.client.post("userstories/bulk_update_milestone", {
      project: projectId,
      bulk_userstories: refs,
      milestone: milestoneId,
    });
  }

  watch(id: number): Promise<unknown> {
    return this.client.post(`userstories/${id}/watch`);
  }

  unwatch(id: number): Promise<unknown> {
    return this.client.post(`userstories/${id}/unwatch`);
  }

  upvote(id: number): Promise<unknown> {
    return this.client.post(`userstories/${id}/upvote`);
  }

  downvote(id: number): Promise<unknown> {
    return this.client.post(`userstories/${id}/downvote`);
  }
}

export class EpicsResource extends ResourceClient<WorkItem> {
  constructor(client: TaigaClient) {
    super(client, { endpoint: "epics", supportsRef: true });
  }

  relatedUserStories(epicId: number): Promise<WorkItem[]> {
    return this.client.get<WorkItem[]>(`epics/${epicId}/related_userstories`);
  }

  linkUserStory(epicId: number, userStoryId: number): Promise<unknown> {
    return this.client.post(`epics/${epicId}/related_userstories`, {
      epic: epicId,
      user_story: userStoryId,
    });
  }

  unlinkUserStory(epicId: number, userStoryId: number): Promise<void> {
    return this.client.delete(`epics/${epicId}/related_userstories/${userStoryId}`);
  }
}
