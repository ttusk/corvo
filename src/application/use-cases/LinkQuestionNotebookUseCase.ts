import type { PluginDataStore } from "@/application/ports/PluginDataStore";
import type { QuestionNotebook } from "@/domain/entities/QuestionNotebook";
import type { Topic } from "@/domain/entities/Topic";
import { EntityRepository } from "@/infrastructure/persistence/EntityRepository";
import { ValidationError } from "@/domain/errors/DomainErrors";
import { LinkQuestionNotebookValidator } from "@/application/validation/InputValidators";

export interface LinkQuestionNotebookInput {
  topicId: string;
  questionNotebook: QuestionNotebook;
}

/**
 * Use case for linking a question notebook to a topic.
 */
export class LinkQuestionNotebookUseCase {
  private readonly topicRepository: EntityRepository<Topic>;

  constructor(private readonly dataStore: PluginDataStore) {
    this.topicRepository = new EntityRepository<Topic>(dataStore, "topics");
  }

  async execute(input: LinkQuestionNotebookInput): Promise<Topic> {
    const validation = new LinkQuestionNotebookValidator().validate(input);
    if (!validation.valid) {
      throw new ValidationError(validation.errors.join(", "));
    }

    return await this.topicRepository.update(input.topicId, (topic) => ({
      ...topic,
      questionNotebook: input.questionNotebook
    }));
  }
}