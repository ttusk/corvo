import type { PluginDataStore } from "@/application/ports/PluginDataStore";
import type { ResourceReference } from "@/domain/entities/ResourceReference";
import type { Topic } from "@/domain/entities/Topic";
import { EntityRepository } from "@/infrastructure/persistence/EntityRepository";
import { ValidationError } from "@/domain/errors/DomainErrors";
import { AddTopicResourceReferenceValidator } from "@/application/validation/InputValidators";

export interface AddTopicResourceReferenceInput {
  topicId: string;
  resourceReference: ResourceReference;
}

/**
 * Use case for adding a resource reference to a topic.
 */
export class AddTopicResourceReferenceUseCase {
  private readonly topicRepository: EntityRepository<Topic>;

  constructor(private readonly dataStore: PluginDataStore) {
    this.topicRepository = new EntityRepository<Topic>(dataStore, "topics");
  }

  async execute(input: AddTopicResourceReferenceInput): Promise<Topic> {
    const validation = new AddTopicResourceReferenceValidator().validate(input);
    if (!validation.valid) {
      throw new ValidationError(validation.errors.join(", "));
    }

    return await this.topicRepository.update(input.topicId, (topic) => ({
      ...topic,
      resourceReferences: [...topic.resourceReferences, input.resourceReference]
    }));
  }
}