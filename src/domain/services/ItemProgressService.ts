import { StudySessionType } from "@/domain/entities/StudySession";
import type { StudyItem } from "@/domain/entities/StudyItem";
import type { StudySession } from "@/domain/entities/StudySession";

/**
 * Computes aggregate progress for study items (PDFs).
 * Used by the cycle to decide whether to skip a completed item.
 */
export class ItemProgressService {
  /**
   * Total number of pages read across all pdf sessions for a given item.
   */
  pagesReadedFor(itemId: string, sessions: StudySession[]): number {
    return sessions
      .filter((session) => session.type === StudySessionType.PDF && session.studyItemId === itemId)
      .reduce((total, session) => total + (session.pagesOrCount ?? 0), 0);
  }

  /**
   * True when the item has a known totalPages target and the read pages
   * meet or exceed it.
   */
  isItemCompleted(item: StudyItem, sessions: StudySession[]): boolean {
    if (item.totalPages === undefined || item.totalPages <= 0) {
      return false;
    }
    return this.pagesReadedFor(item.id, sessions) >= item.totalPages;
  }

  /**
   * Builds a predicate that returns true when a given item id is completed
   * for the supplied set of items and sessions.
   */
  buildCompletionPredicate(
    items: StudyItem[],
    sessions: StudySession[]
  ): (itemId: string) => boolean {
    const byId = new Map(items.map((item) => [item.id, item]));
    return (itemId: string) => {
      const item = byId.get(itemId);
      if (!item) return false;
      return this.isItemCompleted(item, sessions);
    };
  }
}
