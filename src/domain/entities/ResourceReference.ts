import { ValidationError } from "@/domain/errors/DomainErrors";

export type ResourceReferenceType = "pdf" | "video" | "question-notebook" | "link";

/**
 * Represents a resource reference (PDF, video, link, etc.).
 */
export class ResourceReference {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly type: ResourceReferenceType,
    public readonly url?: string,
    public readonly notes?: string
  ) {
    if (!id?.trim()) throw new ValidationError("ResourceReference ID is required");
    if (!title?.trim()) throw new ValidationError("ResourceReference title is required");
    if (!type) throw new ValidationError("ResourceReference type is required");
  }
}