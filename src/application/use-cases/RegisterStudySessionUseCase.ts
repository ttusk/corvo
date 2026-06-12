import type { PluginDataStore } from "@/application/ports/PluginDataStore";
import { StudySession } from "@/domain/entities/StudySession";
import type { Topic } from "@/domain/entities/Topic";
import type { Contest } from "@/domain/entities/Contest";
import type { Subject } from "@/domain/entities/Subject";
import { EntityRepository } from "@/infrastructure/persistence/EntityRepository";
import { ValidationError } from "@/domain/errors/DomainErrors";
import { RegisterStudySessionValidator } from "@/application/validation/InputValidators";

export type RegisterStudySessionInput = StudySession;

/**
 * Use case for registering a new study session.
 */
export class RegisterStudySessionUseCase {
  private readonly contestRepository: EntityRepository<Contest>;
  private readonly subjectRepository: EntityRepository<Subject>;
  private readonly topicRepository: EntityRepository<Topic>;
  private readonly sessionRepository: EntityRepository<StudySession>;

  constructor(private readonly dataStore: PluginDataStore) {
    this.contestRepository = new EntityRepository<Contest>(dataStore, "contests");
    this.subjectRepository = new EntityRepository<Subject>(dataStore, "subjects");
    this.topicRepository = new EntityRepository<Topic>(dataStore, "topics");
    this.sessionRepository = new EntityRepository<StudySession>(dataStore, "studySessions");
  }

  async execute(input: RegisterStudySessionInput): Promise<StudySession> {
    const validation = new RegisterStudySessionValidator().validate(input);
    if (!validation.valid) {
      throw new ValidationError(validation.errors.join(", "));
    }

    await this.contestRepository.findById(input.contestId);

    if (input.subjectId) {
      await this.subjectRepository.findById(input.subjectId);
    }

    if (input.topicId) {
      await this.topicRepository.findById(input.topicId);
    }

    await this.sessionRepository.create(input);

    await this.updateTopicQuestionNotebookStats(input);

    return input;
  }

  private async updateTopicQuestionNotebookStats(session: StudySession): Promise<void> {
    if (session.type !== "questions" || !session.topicId) {
      return;
    }

    await this.topicRepository.update(session.topicId, (topic) => {
      if (!topic.questionNotebook) {
        return topic;
      }

      return {
        ...topic,
        questionNotebook: {
          ...topic.questionNotebook,
          solvedQuestions: topic.questionNotebook.solvedQuestions + (session.pagesOrCount ?? 0),
          correctAnswers: topic.questionNotebook.correctAnswers + (session.correctAnswers ?? 0)
        }
      };
    });
  }
}