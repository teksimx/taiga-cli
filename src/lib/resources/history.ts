import type { TaigaClient } from "../client.js";
import type { TaigaHistoryEntry, WorkItemType } from "../../types/taiga-api.js";
import { HISTORY_TYPES } from "../../types/taiga-api.js";

export class HistoryResource {
  constructor(private readonly client: TaigaClient) {}

  list(type: WorkItemType, objectId: number): Promise<TaigaHistoryEntry[]> {
    const historyType = HISTORY_TYPES[type];
    return this.client.get<TaigaHistoryEntry[]>(`history/${historyType}/${objectId}`);
  }

  addComment(type: WorkItemType, objectId: number, comment: string): Promise<unknown> {
    const map: Record<WorkItemType, string> = {
      "user-story": "userstories",
      task: "tasks",
      issue: "issues",
      epic: "epics",
    };
    return this.client.patch(`${map[type]}/${objectId}`, { comment, version: 1 });
  }

  editComment(type: WorkItemType, objectId: number, commentId: string, comment: string): Promise<unknown> {
    const historyType = HISTORY_TYPES[type];
    return this.client.post(`history/${historyType}/${objectId}/edit_comment`, {
      id: commentId,
      comment,
    });
  }

  deleteComment(type: WorkItemType, objectId: number, commentId: string): Promise<unknown> {
    const historyType = HISTORY_TYPES[type];
    return this.client.post(`history/${historyType}/${objectId}/delete_comment`, {
      id: commentId,
    });
  }
}
