import { ValidationError } from "@/domain/errors/DomainErrors";
import type { QuestionNotebook } from "@/domain/entities/QuestionNotebook";
import type { ResourceReference } from "@/domain/entities/ResourceReference";

/**
 * Represents a topic under a subject.
 */
export class Topic {
  constructor(
    public readonly id: string,
    public readonly subjectId: string,
    public readonly name: string,
    public readonly resourceReferences: ResourceReference[] = [],
    public readonly questionNotebook?: QuestionNotebook
  ) {
    if (!id?.trim()) throw new ValidationError("Topic ID is required");
    if (!subjectId?.trim()) throw new ValidationError("Topic subjectId is required");
    if (!name?.trim()) throw new ValidationError("Topic name is required");
  }
}
