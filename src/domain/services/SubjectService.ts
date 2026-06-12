import { Result } from "@/domain/types/Result";
import { DomainError } from "@/domain/errors/DomainErrors";
import type { Subject } from "@/domain/entities/Subject";
import type { StudyItem } from "@/domain/entities/StudyItem";
import type { Topic } from "@/domain/entities/Topic";

/**
 * Domain service for managing subject relationships and operations.
 */
export class SubjectService {
  /**
   * Adds a study item to a subject.
   * @returns Result with updated subject or domain error
   */
  addStudyItem(subject: Subject, item: StudyItem): Result<Subject, DomainError> {
    if (item.subjectId !== subject.id) {
      return Result.error(new DomainError("Item does not belong to this subject"));
    }

    if (subject.itemIds.includes(item.id)) {
      return Result.error(new DomainError("Item already exists in subject"));
    }

    return Result.ok({
      ...subject,
      itemIds: [...subject.itemIds, item.id]
    });
  }

  /**
   * Removes a study item from a subject.
   * @returns Result with updated subject or domain error
   */
  removeStudyItem(subject: Subject, itemId: string): Result<Subject, DomainError> {
    if (!subject.itemIds.includes(itemId)) {
      return Result.error(new DomainError("Item not found in subject"));
    }

    return Result.ok({
      ...subject,
      itemIds: subject.itemIds.filter((id) => id !== itemId)
    });
  }

  /**
   * Adds a topic to a subject.
   * @returns Result with updated subject or domain error
   */
  addTopic(subject: Subject, topic: Topic): Result<Subject, DomainError> {
    if (topic.subjectId !== subject.id) {
      return Result.error(new DomainError("Topic does not belong to this subject"));
    }

    if (subject.topicIds.includes(topic.id)) {
      return Result.error(new DomainError("Topic already exists in subject"));
    }

    return Result.ok({
      ...subject,
      topicIds: [...subject.topicIds, topic.id]
    });
  }

  /**
   * Removes a topic from a subject.
   * @returns Result with updated subject or domain error
   */
  removeTopic(subject: Subject, topicId: string): Result<Subject, DomainError> {
    if (!subject.topicIds.includes(topicId)) {
      return Result.error(new DomainError("Topic not found in subject"));
    }

    return Result.ok({
      ...subject,
      topicIds: subject.topicIds.filter((id) => id !== topicId)
    });
  }

  /**
   * Reorders subjects within a contest by assigning new order values.
   * @returns Array of updated subjects
   */
  reorderSubjects(subjects: Subject[], orderedIds: string[]): Result<Subject[], DomainError> {
    const subjectMap = new Map(subjects.map((s) => [s.id, s]));

    for (const id of orderedIds) {
      if (!subjectMap.has(id)) {
        return Result.error(new DomainError(`Subject "${id}" not found`));
      }
    }

    const updated = orderedIds.map((id, index) => ({
      ...subjectMap.get(id)!,
      order: index + 1
    }));

    return Result.ok(updated);
  }
}