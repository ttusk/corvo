import type { PluginDataStore } from "@/application/ports/PluginDataStore";
import { AdvanceCycleUseCase } from "@/application/use-cases/AdvanceCycleUseCase";
import { GetActiveContestSummaryUseCase } from "@/application/use-cases/GetActiveContestSummaryUseCase";
import { GetActiveCycleSnapshotUseCase } from "@/application/use-cases/GetActiveCycleSnapshotUseCase";
import { RegisterStudySessionUseCase } from "@/application/use-cases/RegisterStudySessionUseCase";
import { ListSubjectsForActiveContestUseCase } from "@/application/use-cases/ListSubjectsForActiveContestUseCase";
import type { CorvoPluginData } from "@/domain/types/CorvoPluginData";
import { DomHelpers } from "@/ui/view/shared/DomHelpers";
import { Notice } from "obsidian";

/**
 * Dashboard tab component - shows contest overview and quick actions.
 */
export class DashboardTab {
  private readonly advanceCycleUseCase: AdvanceCycleUseCase;
  private readonly getActiveCycleSnapshotUseCase: GetActiveCycleSnapshotUseCase;
  private readonly getActiveContestSummaryUseCase: GetActiveContestSummaryUseCase;
  private readonly registerStudySessionUseCase: RegisterStudySessionUseCase;
  private readonly listSubjectsForActiveContestUseCase: ListSubjectsForActiveContestUseCase;

  constructor(
    private readonly dataStore: PluginDataStore,
    private readonly onUpdate: () => Promise<void>
  ) {
    this.advanceCycleUseCase = new AdvanceCycleUseCase(dataStore);
    this.getActiveCycleSnapshotUseCase = new GetActiveCycleSnapshotUseCase(dataStore);
    this.getActiveContestSummaryUseCase = new GetActiveContestSummaryUseCase(dataStore);
    this.registerStudySessionUseCase = new RegisterStudySessionUseCase(dataStore);
    this.listSubjectsForActiveContestUseCase = new ListSubjectsForActiveContestUseCase(dataStore);
  }

  /**
   * Renders the dashboard tab content.
   */
  async render(container: HTMLElement, data: CorvoPluginData): Promise<void> {
    const activeContest = data.contests.find((contest) => contest.id === data.activeContestId) ?? null;

    if (!activeContest) {
      container.append(
        DomHelpers.createSectionTitle("Dashboard"),
        DomHelpers.createEmptyState(
          "Nenhum concurso ativo",
          "Crie um concurso na aba Concursos para começar."
        )
      );
      return;
    }

    const snapshot = await this.getActiveCycleSnapshotUseCase.execute();
    const summary = await this.getActiveContestSummaryUseCase.execute();

    container.appendChild(DomHelpers.createSectionTitle("Dashboard"));
    container.appendChild(
      DomHelpers.createParagraph("Visão geral do concurso ativo e das próximas ações.")
    );

    // Cycle control overview
    const overview = DomHelpers.createCard("Controle do ciclo");
    overview.appendChild(
      DomHelpers.createTable(
        ["Campo", "Valor"],
        [
          ["Concurso ativo", activeContest.name],
          ["Matéria atual", snapshot.currentSubject?.name ?? "Não definida"],
          ["Próxima matéria", snapshot.nextSubject?.name ?? "Não definida"],
          ["Item atual", this.formatIdLabel(snapshot.currentItemId)],
          ["Próximo item", this.formatIdLabel(snapshot.nextItemId)]
        ]
      )
    );
    container.appendChild(overview);

    // Action buttons
    const cycleActions = DomHelpers.createCard("Ações");
    const actionRow = DomHelpers.createElement("div", "corvo-inline-actions");
    actionRow.append(
      DomHelpers.createButton("Finalizar ciclo atual", {
        className: "corvo-primary-button",
        onClick: async () => {
          try {
            await this.advanceCycleUseCase.execute();
            await this.onUpdate();
          } catch (error) {
            this.notifyError(error, "Não foi possível finalizar o ciclo.");
          }
        }
      }),
      DomHelpers.createButton("Registrar sessão de questões", {
        onClick: async () => {
          await this.registerQuickSession("questions");
        }
      }),
      DomHelpers.createButton("Registrar sessão de vídeo", {
        onClick: async () => {
          await this.registerQuickSession("video");
        }
      })
    );
    cycleActions.appendChild(actionRow);
    container.appendChild(cycleActions);

    // Subject summary card
    const subjectSummaryCard = DomHelpers.createCard("Resumo por matéria");
    subjectSummaryCard.appendChild(
      DomHelpers.createTable(
        ["Matéria", "Sessões", "PDF", "Questões", "Acerto"],
        summary.subjectSummaries.map((subjectSummary) => [
          subjectSummary.subjectName,
          String(subjectSummary.totalSessions),
          String(subjectSummary.pdfProgressCount),
          String(subjectSummary.questionProgressCount),
          subjectSummary.questionAccuracy === null
            ? "-"
            : `${Math.round(subjectSummary.questionAccuracy * 100)}%`
        ])
      )
    );
    container.appendChild(subjectSummaryCard);
  }

  /**
   * Formats an ID label for display.
   */
  private formatIdLabel(id: string | null): string {
    if (!id) return "Não definido";
    const parts = id.split("-");
    return parts.length > 0 ? parts[parts.length - 1] : id;
  }

  /**
   * Registers a quick study session for the current subject.
   */
  private async registerQuickSession(type: "questions" | "video" | "pdf"): Promise<void> {
    const data = await this.dataStore.load();

    if (!data.activeContestId) {
      new Notice("Nenhum concurso ativo.");
      return;
    }

    const subject = (await this.listSubjectsForActiveContestUseCase.execute())[0];

    if (!subject) {
      new Notice("Nenhuma matéria ativa encontrada.");
      return;
    }

    const topic = data.topics.find((candidate) => candidate.subjectId === subject.id);
    await this.registerStudySessionUseCase.execute({
      id: `${type}-${Date.now()}`,
      contestId: data.activeContestId,
      subjectId: subject.id,
      topicId: topic?.id,
      type,
      studiedAt: new Date().toISOString(),
      pagesOrCount: type === "questions" ? 10 : 1,
      correctAnswers: type === "questions" ? 8 : undefined,
      completed: true
    });

    await this.onUpdate();
  }

  /**
   * Displays an error notification.
   */
  private notifyError(error: unknown, fallbackMessage: string): void {
    new Notice(error instanceof Error ? error.message : fallbackMessage);
  }
}
