import type { PluginDataStore } from "@/application/ports/PluginDataStore";
import type { Subject } from "@/domain/entities/Subject";
import { EntityRepository } from "@/infrastructure/persistence/EntityRepository";
import { ValidationError } from "@/domain/errors/DomainErrors";
import { SetSubjectActiveStateValidator } from "@/application/validation/InputValidators";

export interface SetSubjectActiveStateInput {
  subjectId: string;
  isActive: boolean;
}

/**
 * Use case for setting a subject's active state.
 */
export class SetSubjectActiveStateUseCase {
  private readonly subjectRepository: EntityRepository<Subject>;

  constructor(private readonly dataStore: PluginDataStore) {
    this.subjectRepository = new EntityRepository<Subject>(dataStore, "subjects");
  }

  async execute(input: SetSubjectActiveStateInput): Promise<Subject> {
    const validation = new SetSubjectActiveStateValidator().validate(input);
    if (!validation.valid) {
      throw new ValidationError(validation.errors.join(", "));
    }

    return await this.subjectRepository.update(input.subjectId, (subject) => ({
      ...subject,
      isActive: input.isActive
    }));
  }
}