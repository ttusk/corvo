import { ValidationError } from "@/domain/errors/DomainErrors";

/**
 * Represents a public exam contest.
 */
export class Contest {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly subjectIds: string[] = [],
    public readonly wall: { noticeLinks: any[]; examLinks: any[]; subjectSnapshots: any[]; notes?: string } = { noticeLinks: [], examLinks: [], subjectSnapshots: [] }
  ) {
    if (!id?.trim()) throw new ValidationError("Contest ID is required");
    if (!name?.trim()) throw new ValidationError("Contest name is required");
  }
}