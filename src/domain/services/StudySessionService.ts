import { Result } from "@/domain/types/Result";
import { DomainError } from "@/domain/errors/DomainErrors";
import type { StudySession } from "@/domain/entities/StudySession";
import type { Topic } from "@/domain/entities/Topic";

/**
 * Domain service for study session operations and validation.
 */
export class StudySessionService {
  /**
   * Validates that a study session has valid data.
   * @returns Result with void or domain error
   */
  validateSession(session: StudySession): Result<void, DomainError> {
    if (!session.id?.trim()) {
      return Result.error(new DomainError("Session ID is required"));
    }

    if (!session.contestId?.trim()) {
      return Result.error(new DomainError("Contest ID is required"));
    }

    if (!session.type) {
      return Result.error(new DomainError("Session type is required"));
    }

    const validTypes = ["pdf", "video", "questions"];
    if (!validTypes.includes(session.type)) {
      return Result.error(new DomainError(`Invalid session type. Must be one of: ${validTypes.join(", ")}`));
    }

    if (!session.studiedAt?.trim()) {
      return Result.error(new DomainError("Study date is required"));
    }

    if (session.pagesOrCount !== undefined && session.pagesOrCount < 0) {
      return Result.error(new DomainError("Pages or count cannot be negative"));
    }

    if (session.correctAnswers !== undefined && session.correctAnswers < 0) {
      return Result.error(new DomainError("Correct answers cannot be negative"));
    }

    if (session.correctAnswers !== undefined && session.pagesOrCount !== undefined && session.correctAnswers > session.pagesOrCount) {
      return Result.error(new DomainError("Correct answers cannot exceed total questions"));
    }

    return Result.ok(undefined);
  }

  /**
   * Calculates accuracy for a question session.
   * @returns Accuracy ratio or null if not applicable
   */
  calculateAccuracy(session: StudySession): number | null {
    if (session.type !== "questions" || session.pagesOrCount === undefined || session.pagesOrCount === 0) {
      return null;
    }

    return (session.correctAnswers ?? 0) / session.pagesOrCount;
  }

  /**
   * Groups question sessions by date.
   * @returns Map of date strings to aggregated session data
   */
  groupQuestionSessionsByDate(sessions: StudySession[]): Map<string, { questionCount: number; correctAnswers: number }> {
    const grouped = new Map<string, { questionCount: number; correctAnswers: number }>();

    sessions
      .filter((s) => s.type === "questions")
      .forEach((session) => {
        const date = session.studiedAt.slice(0, 10);
        const current = grouped.get(date) ?? { questionCount: 0, correctAnswers: 0 };

        grouped.set(date, {
          questionCount: current.questionCount + (session.pagesOrCount ?? 0),
          correctAnswers: current.correctAnswers + (session.correctAnswers ?? 0)
        });
      });

    return grouped;
  }
}