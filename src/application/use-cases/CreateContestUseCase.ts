import type { PluginDataStore } from "@/application/ports/PluginDataStore";
import { Contest } from "@/domain/entities/Contest";
import { ContestState } from "@/domain/entities/ContestState";
import { EntityRepository } from "@/infrastructure/persistence/EntityRepository";
import { ValidationError } from "@/domain/errors/DomainErrors";
import { CreateContestValidator } from "@/application/validation/InputValidators";

export interface CreateContestInput {
  id: string;
  name: string;
}

/**
 * Use case for creating a new contest.
 */
export class CreateContestUseCase {
  private readonly contestRepository: EntityRepository<Contest>;

  constructor(private readonly dataStore: PluginDataStore) {
    this.contestRepository = new EntityRepository<Contest>(dataStore, "contests");
  }

  async execute(input: CreateContestInput): Promise<Contest> {
    const validation = new CreateContestValidator().validate(input);
    if (!validation.valid) {
      throw new ValidationError(validation.errors.join(", "));
    }

    const contest = new Contest(input.id, input.name, [], { noticeLinks: [], examLinks: [], subjectSnapshots: [] });

    await this.contestRepository.create(contest);

    const contestState = new ContestState(input.id);

    const data = await this.dataStore.load();
    await this.dataStore.save({
      ...data,
      activeContestId: data.activeContestId ?? contest.id,
      contestStates: [...data.contestStates, contestState]
    });

    return contest;
  }
}