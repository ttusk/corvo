import type { PluginDataStore } from "@/application/ports/PluginDataStore";
import type { StudyItem } from "@/domain/entities/StudyItem";
import { ValidationError } from "@/domain/errors/DomainErrors";
import { EntityRepository } from "@/infrastructure/persistence/EntityRepository";

export interface UpdateStudyItemInput {
  itemId: string;
  weight?: number;
  questionCount?: number;
}

/**
 * Use case for updating a study item's configuration.
 */
export class UpdateStudyItemUseCase {
  private readonly itemRepository: EntityRepository<StudyItem>;

  constructor(private readonly dataStore: PluginDataStore) {
    this.itemRepository = new EntityRepository<StudyItem>(dataStore, "studyItems");
  }

  async execute(input: UpdateStudyItemInput): Promise<StudyItem> {
    if (!input.itemId?.trim()) {
      throw new ValidationError("itemId is required");
    }
    if (input.weight !== undefined && input.weight < 0) {
      throw new ValidationError("weight cannot be negative");
    }
    if (input.questionCount !== undefined && input.questionCount < 0) {
      throw new ValidationError("questionCount cannot be negative");
    }

    return await this.itemRepository.update(input.itemId, (item) => ({
      ...item,
      weight: input.weight !== undefined ? input.weight : item.weight,
      questionCount: input.questionCount !== undefined ? input.questionCount : item.questionCount
    }));
  }
}
