import type { PluginDataStore } from "@/application/ports/PluginDataStore";
import { GetActiveContestSummaryUseCase } from "@/application/use-cases/GetActiveContestSummaryUseCase";
import { GetActiveContestProgressDashboardUseCase } from "@/application/use-cases/GetActiveContestProgressDashboardUseCase";
import { GetActiveCycleSnapshotUseCase } from "@/application/use-cases/GetActiveCycleSnapshotUseCase";
import type { LeifPluginData } from "@/domain/types/LeifPluginData";
import { DomHelpers } from "@/ui/view/shared/DomHelpers";

/**
 * Dashboard tab component - shows contest overview and summary.
 */
export class DashboardTab {
  private readonly getActiveCycleSnapshotUseCase: GetActiveCycleSnapshotUseCase;
  private readonly getActiveContestSummaryUseCase: GetActiveContestSummaryUseCase;
  private readonly getActiveContestProgressDashboardUseCase: GetActiveContestProgressDashboardUseCase;

  constructor(
    private readonly dataStore: PluginDataStore,
    private readonly onUpdate: () => Promise<void>
  ) {
    this.getActiveCycleSnapshotUseCase = new GetActiveCycleSnapshotUseCase(dataStore);
    this.getActiveContestSummaryUseCase = new GetActiveContestSummaryUseCase(dataStore);
    this.getActiveContestProgressDashboardUseCase = new GetActiveContestProgressDashboardUseCase(dataStore);
  }

  /**
   * Renders the dashboard tab content.
   */
  async render(container: HTMLElement, data: LeifPluginData): Promise<void> {
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
    const progress = await this.getActiveContestProgressDashboardUseCase.execute();
    const itemMap = new Map(data.studyItems.map((item) => [item.id, item.title]));
    const recommendedSubject = snapshot.currentSubject ?? snapshot.nextSubject;
    const afterRecommendedSubject =
      snapshot.currentSubject && snapshot.nextSubject?.id !== snapshot.currentSubject.id
        ? snapshot.nextSubject
        : null;
    const recommendedItemId = snapshot.currentItemId ?? snapshot.nextItemId;
    const afterRecommendedItemId = snapshot.currentItemId ? snapshot.nextItemId : null;

    container.appendChild(DomHelpers.createSectionTitle("Dashboard"));
    container.appendChild(
      DomHelpers.createParagraph("Visão geral do concurso ativo.")
    );

    // Cycle info cards
    const cycleSection = DomHelpers.createElement("div", "leif-grid leif-grid-2");
    cycleSection.appendChild(
      this.renderCycleCard("Matéria recomendada", recommendedSubject?.name ?? "Não definida", "Depois", afterRecommendedSubject?.name ?? "—")
    );
    cycleSection.appendChild(
      this.renderCycleCard("Item recomendado", itemMap.get(recommendedItemId ?? "") ?? "Não definido", "Seguinte", itemMap.get(afterRecommendedItemId ?? "") ?? "—")
    );
    container.appendChild(cycleSection);

    // Subject summary card
    const subjectSummaryCard = DomHelpers.createCard("Resumo por matéria");
    const progressMap = new Map(progress.pdfProgressBySubject.map((s) => [s.subjectId, s]));
    const rows = summary.subjectSummaries.map((subjectSummary) => {
      const subjectProgress = progressMap.get(subjectSummary.subjectId);
      const totalPages = subjectProgress?.items.reduce((sum, item) => sum + (item.totalPages ?? 0), 0) ?? 0;
      const readPages = subjectProgress?.totalProgressCount ?? 0;
      const progressBar = DomHelpers.createProgressBar(readPages, totalPages > 0 ? totalPages : undefined);
      return [
        subjectSummary.subjectName,
        String(subjectSummary.totalSessions),
        progressBar,
        String(subjectSummary.questionProgressCount),
        subjectSummary.questionAccuracy === null
          ? "-"
          : `${Math.round(subjectSummary.questionAccuracy * 100)}%`
      ];
    });

    subjectSummaryCard.appendChild(
      DomHelpers.createTable(
        ["Matéria", "Sessões", "Páginas", "Questões", "Acerto"],
        rows
      )
    );
    container.appendChild(subjectSummaryCard);
  }

  private renderCycleCard(
    label: string,
    value: string,
    nextLabel: string,
    nextValue: string
  ): HTMLElement {
    const card = DomHelpers.createElement("div", "leif-card leif-cycle-card");
    const main = DomHelpers.createElement("div", "leif-cycle-main");
    const mainLabel = DomHelpers.createElement("span", "leif-cycle-label");
    mainLabel.textContent = label;
    const mainValue = DomHelpers.createElement("span", "leif-cycle-value");
    mainValue.textContent = value;
    main.append(mainLabel, mainValue);

    const next = DomHelpers.createElement("div", "leif-cycle-next");
    const nextLabelEl = DomHelpers.createElement("span", "leif-cycle-next-label");
    nextLabelEl.textContent = `${nextLabel}: `;
    const nextValueEl = DomHelpers.createElement("span", "leif-cycle-next-value");
    nextValueEl.textContent = nextValue;
    next.append(nextLabelEl, nextValueEl);

    card.append(main, next);
    return card;
  }
}
