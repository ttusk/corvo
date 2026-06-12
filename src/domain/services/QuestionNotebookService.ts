import { Result } from "@/domain/types/Result";
import { DomainError } from "@/domain/errors/DomainErrors";
import type { Topic } from "@/domain/entities/Topic";
import type { StudySession } from "@/domain/entities/StudySession";

/**
 * Domain service for question notebook operations.
 */
export class QuestionNotebookService {
  /**
   * Updates notebook statistics when a question session is registered.
   * @returns Result with updated topic or domain error
   */
  addSessionStats(topic: Topic, session: StudySession): Result<Topic, DomainError> {
    if (session.type !== "questions") {
      return Result.ok(topic);
    }

    if (!topic.questionNotebook) {
      return Result.error(new DomainError("Topic has no question notebook"));
    }

    const solvedQuestions = topic.questionNotebook.solvedQuestions + (session.pagesOrCount ?? 0);
    const correctAnswers = topic.questionNotebook.correctAnswers + (session.correctAnswers ?? 0);

    return Result.ok({
      ...topic,
      questionNotebook: {
        ...topic.questionNotebook,
        solvedQuestions,
        correctAnswers
      }
    });
  }

  /**
   * Reverts notebook statistics when a question session is deleted.
   * @returns Result with updated topic or domain error
   */
  removeSessionStats(topic: Topic, session: StudySession): Result<Topic, DomainError> {
    if (session.type !== "questions") {
      return Result.ok(topic);
    }

    if (!topic.questionNotebook) {
      return Result.error(new DomainError("Topic has no question notebook"));
    }

    const solvedQuestions = Math.max(0, topic.questionNotebook.solvedQuestions - (session.pagesOrCount ?? 0));
    const correctAnswers = Math.max(0, topic.questionNotebook.correctAnswers - (session.correctAnswers ?? 0));

    return Result.ok({
      ...topic,
      questionNotebook: {
        ...topic.questionNotebook,
        solvedQuestions,
        correctAnswers
      }
    });
  }

  /**
   * Calculates accuracy for a notebook.
   * @returns Accuracy ratio or null if no questions solved
   */
  calculateAccuracy(topic: Topic): number | null {
    if (!topic.questionNotebook || topic.questionNotebook.solvedQuestions === 0) {
      return null;
    }

    return topic.questionNotebook.correctAnswers / topic.questionNotebook.solvedQuestions;
  }
}