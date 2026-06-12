import type { PluginDataStore } from "@/application/ports/PluginDataStore";
import type { ContestState } from "@/domain/entities/ContestState";
import type { Subject } from "@/domain/entities/Subject";
import { CycleService } from "@/domain/services/CycleService";
import { ActiveContestGuard } from "@/application/guards/ActiveContestGuard";
import { NotFoundError } from "@/domain/errors/DomainErrors";

/**
 * Use case for advancing the study cycle to the next subject.
 */
export class AdvanceCycleUseCase {
  private readonly guard: ActiveContestGuard;

  constructor(
    private readonly dataStore: PluginDataStore,
    private readonly cycleService: CycleService = new CycleService()
  ) {
    this.guard = new ActiveContestGuard(dataStore);
  }

  async execute(): Promise<ContestState> {
    const activeContestId = await this.guard.requireActiveContest();

    const contestSubjects = await this.guard.getActiveContestSubjects();

    const data = await this.dataStore.load();
    const currentState = data.contestStates.find((state) => state.contestId === activeContestId);

    if (!currentState) {
      throw new NotFoundError("contestStates", activeContestId);
    }

    const nextSubject = this.cycleService.getNextActiveSubject(
      contestSubjects,
      currentState.currentSubjectId ?? undefined
    );

    if (!nextSubject) {
      throw new Error(`Contest "${activeContestId}" has no active subjects.`);
    }

    const nextState: ContestState = {
      contestId: currentState.contestId,
      currentSubjectId: nextSubject.id,
      currentItemId: this.cycleService.getNextItemId(nextSubject)
    };

    await this.dataStore.save({
      ...data,
      contestStates: data.contestStates.map((state) =>
        state.contestId === nextState.contestId ? nextState : state
      )
    });

    return nextState;
  }
}