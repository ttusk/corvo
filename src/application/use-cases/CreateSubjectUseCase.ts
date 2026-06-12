import type { PluginDataStore } from "@/application/ports/PluginDataStore";
import { Subject } from "@/domain/entities/Subject";
import { Contest } from "@/domain/entities/Contest";
import { EntityRepository } from "@/infrastructure/persistence/EntityRepository";
import { ValidationError } from "@/domain/errors/DomainErrors";
import { CreateSubjectValidator } from "@/application/validation/InputValidators";

export interface CreateSubjectInput {
  id: string;
  contestId: string;
  name: string;
  plannedStudyMinutes: number;
  isActive?: boolean;
  currentStage?: string;
}

/**
 * Use case for creating a new subject under a contest.
 */
export class CreateSubjectUseCase {
  private readonly contestRepository: EntityRepository<Contest>;
  private readonly subjectRepository: EntityRepository<Subject>;

  constructor(private readonly dataStore: PluginDataStore) {
    this.contestRepository = new EntityRepository<Contest>(dataStore, "contests");
    this.subjectRepository = new EntityRepository<Subject>(dataStore, "subjects");
  }

  async execute(input: CreateSubjectInput): Promise<Subject> {
    const validation = new CreateSubjectValidator().validate(input);
    if (!validation.valid) {
      throw new ValidationError(validation.errors.join(", "));
    }

    const contest = await this.contestRepository.findById(input.contestId);

    const contestSubjects = (await this.subjectRepository.findAll())
      .filter((subject) => subject.contestId === input.contestId);
    const nextOrder = contestSubjects.length === 0
      ? 1
      : Math.max(...contestSubjects.map((subject) => subject.order)) + 1;

    const subject = new Subject(
      input.id,
      input.contestId,
      input.name,
      nextOrder,
      input.isActive ?? true,
      input.plannedStudyMinutes,
      input.currentStage,
      [],
      []
    );

    await this.subjectRepository.create(subject);

    await this.contestRepository.update(input.contestId, (contest) => ({
      ...contest,
      subjectIds: [...contest.subjectIds, subject.id]
    }));

    return subject;
  }
}