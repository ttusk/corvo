import type { PluginDataStore } from "@/application/ports/PluginDataStore";
import type { ResourceReference } from "@/domain/entities/ResourceReference";
import type { StudyItem } from "@/domain/entities/StudyItem";
import { EntityRepository } from "@/infrastructure/persistence/EntityRepository";
import { ValidationError } from "@/domain/errors/DomainErrors";
import { AddStudyItemResourceReferenceValidator } from "@/application/validation/InputValidators";

export interface AddStudyItemResourceReferenceInput {
  studyItemId: string;
  resourceReference: ResourceReference;
}

/**
 * Use case for adding a resource reference to a study item.
 */
export class AddStudyItemResourceReferenceUseCase {
  private readonly studyItemRepository: EntityRepository<StudyItem>;

  constructor(private readonly dataStore: PluginDataStore) {
    this.studyItemRepository = new EntityRepository<StudyItem>(dataStore, "studyItems");
  }

  async execute(input: AddStudyItemResourceReferenceInput): Promise<StudyItem> {
    const validation = new AddStudyItemResourceReferenceValidator().validate(input);
    if (!validation.valid) {
      throw new ValidationError(validation.errors.join(", "));
    }

    return await this.studyItemRepository.update(input.studyItemId, (studyItem) => ({
      ...studyItem,
      resourceReferences: [...(studyItem.resourceReferences ?? []), input.resourceReference]
    }));
  }
}