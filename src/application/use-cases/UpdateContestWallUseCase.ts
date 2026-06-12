import type { PluginDataStore } from "@/application/ports/PluginDataStore";
import type { Contest } from "@/domain/entities/Contest";
import type { Wall } from "@/domain/entities/Wall";
import { EntityRepository } from "@/infrastructure/persistence/EntityRepository";
import { ValidationError } from "@/domain/errors/DomainErrors";
import { UpdateContestWallValidator } from "@/application/validation/InputValidators";

export interface UpdateContestWallInput {
  contestId: string;
  wall: Wall;
}

/**
 * Use case for updating a contest's wall.
 */
export class UpdateContestWallUseCase {
  private readonly contestRepository: EntityRepository<Contest>;

  constructor(private readonly dataStore: PluginDataStore) {
    this.contestRepository = new EntityRepository<Contest>(dataStore, "contests");
  }

  async execute(input: UpdateContestWallInput): Promise<Contest> {
    const validation = new UpdateContestWallValidator().validate(input);
    if (!validation.valid) {
      throw new ValidationError(validation.errors.join(", "));
    }

    return await this.contestRepository.update(input.contestId, (contest) => ({
      ...contest,
      wall: input.wall
    }));
  }
}