import type { PluginDataStore } from "@/application/ports/PluginDataStore";
import type { ResourceReference } from "@/domain/entities/ResourceReference";
import { StudyItem } from "@/domain/entities/StudyItem";
import { Subject } from "@/domain/entities/Subject";
import { EntityRepository } from "@/infrastructure/persistence/EntityRepository";
import { ValidationError } from "@/domain/errors/DomainErrors";
import { CreateStudyItemValidator } from "@/application/validation/InputValidators";

export interface CreateStudyItemInput {
  id: string;
  subjectId: string;
  title: string;
  weight?: number;
  questionCount?: number;
  resourceReferences?: ResourceReference[];
}

/**
 * Use case for creating a new study item under a subject.
 */
export class CreateStudyItemUseCase {
  private readonly subjectRepository: EntityRepository<Subject>;
  private readonly studyItemRepository: EntityRepository<StudyItem>;

  constructor(private readonly dataStore: PluginDataStore) {
    this.subjectRepository = new EntityRepository<Subject>(dataStore, "subjects");
    this.studyItemRepository = new EntityRepository<StudyItem>(dataStore, "studyItems");
  }

  async execute(input: CreateStudyItemInput): Promise<StudyItem> {
    const validation = new CreateStudyItemValidator().validate(input);
    if (!validation.valid) {
      throw new ValidationError(validation.errors.join(", "));
    }

    const subject = await this.subjectRepository.findById(input.subjectId);

    const subjectItems = (await this.studyItemRepository.findAll())
      .filter((item) => item.subjectId === input.subjectId);

    const nextItem = new StudyItem(
      input.id,
      input.subjectId,
      input.title,
      subjectItems.length + 1,
      input.weight,
      input.questionCount,
      input.resourceReferences ?? []
    );

    await this.studyItemRepository.create(nextItem);

    await this.subjectRepository.update(input.subjectId, (subject) => ({
      ...subject,
      itemIds: [...subject.itemIds, nextItem.id]
    }));

    return nextItem;
  }
}