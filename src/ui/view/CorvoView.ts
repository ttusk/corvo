import { ItemView, type WorkspaceLeaf } from "obsidian";

import type { PluginDataStore } from "@/application/ports/PluginDataStore";
import type { CorvoPluginData } from "@/domain/types/CorvoPluginData";
import { ContestsTab } from "@/ui/view/components/ContestsTab";
import { CycleTab } from "@/ui/view/components/CycleTab";
import { DashboardTab } from "@/ui/view/components/DashboardTab";
import { ItemsTab } from "@/ui/view/components/ItemsTab";
import { SessionsTab } from "@/ui/view/components/SessionsTab";
import { TopicsTab } from "@/ui/view/components/TopicsTab";
import { WallTab } from "@/ui/view/components/WallTab";
import { CORVO_ICON, CORVO_VIEW_TYPE } from "@/ui/view/registerCorvoView";
import { DomHelpers } from "@/ui/view/shared/DomHelpers";

type CorvoTabId =
  | "dashboard"
  | "contests"
  | "cycle"
  | "items"
  | "topics"
  | "sessions"
  | "wall";

interface CorvoTabDefinition {
  id: CorvoTabId;
  label: string;
}

const TABS: CorvoTabDefinition[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "contests", label: "Concursos" },
  { id: "cycle", label: "Ciclo e Matérias" },
  { id: "items", label: "Itens e PDFs" },
  { id: "topics", label: "Assuntos e Questões" },
  { id: "sessions", label: "Sessões" },
  { id: "wall", label: "Mural" }
];

/**
 * Main Corvo view with incremental rendering optimization.
 * Builds the shell structure once and only updates the active tab content on changes.
 */
export class CorvoView extends ItemView {
  private activeTab: CorvoTabId = "dashboard";
  private selectedSubjectId: string | null = null;

  private shell?: HTMLElement;
  private headerActions?: HTMLElement;
  private tabBar?: HTMLElement;
  private activeTabContainer?: HTMLElement;
  private tabButtons: Map<CorvoTabId, HTMLElement> = new Map();

  private readonly dashboardTab: DashboardTab;
  private readonly contestsTab: ContestsTab;
  private readonly cycleTab: CycleTab;
  private readonly itemsTab: ItemsTab;
  private readonly topicsTab: TopicsTab;
  private readonly sessionsTab: SessionsTab;
  private readonly wallTab: WallTab;

  constructor(
    leaf: WorkspaceLeaf,
    private readonly dataStore: PluginDataStore
  ) {
    super(leaf);
    this.dashboardTab = new DashboardTab(dataStore, () => this.refresh());
    this.contestsTab = new ContestsTab(dataStore, () => this.refresh());
    this.cycleTab = new CycleTab(dataStore, () => this.refresh());
    this.itemsTab = new ItemsTab(dataStore, () => this.refresh());
    this.topicsTab = new TopicsTab(dataStore, () => this.refresh());
    this.sessionsTab = new SessionsTab(dataStore, () => this.refresh());
    this.wallTab = new WallTab(dataStore, () => this.refresh());
  }

  getViewType(): string {
    return CORVO_VIEW_TYPE;
  }

  getDisplayText(): string {
    return "Corvo";
  }

  override getIcon(): string {
    return CORVO_ICON;
  }

  override async onOpen(): Promise<void> {
    await this.render();
  }

  /**
   * Full render - builds the shell structure once, then updates dynamic content.
   */
  async render(): Promise<void> {
    const data = await this.dataStore.load();
    this.ensureSelectedSubject(data);

    if (!this.shell) {
      this.buildShell();
    }

    await this.updateHeader(data);
    await this.updateActiveTab(data);
  }

  /**
   * Refresh - updates only the active tab content without rebuilding the shell.
   */
  private async refresh(): Promise<void> {
    const data = await this.dataStore.load();
    this.ensureSelectedSubject(data);
    await this.updateHeader(data);
    await this.updateActiveTab(data);
  }

  /**
   * Builds the shell structure once.
   */
  private buildShell(): void {
    this.contentEl.innerHTML = "";
    this.contentEl.className = "corvo-view";

    this.shell = DomHelpers.createElement("div", "corvo-shell");

    const header = DomHelpers.createElement("header", "corvo-header");
    const titleGroup = DomHelpers.createElement("div", "corvo-title-group");
    titleGroup.append(
      DomHelpers.createHeading("Corvo"),
      DomHelpers.createParagraph("Planejamento e acompanhamento dos estudos.")
    );

    this.headerActions = DomHelpers.createElement("div", "corvo-header-actions");
    header.append(titleGroup, this.headerActions);

    this.tabBar = DomHelpers.createElement("nav", "corvo-tab-bar");
    TABS.forEach((tab) => {
      const button = DomHelpers.createButton(tab.label, {
        dataset: { tab: tab.id },
        className: "corvo-tab-button",
        onClick: async () => {
          this.activeTab = tab.id;
          this.updateTabButtonStyles();
          await this.refresh();
        }
      });
      this.tabButtons.set(tab.id, button);
      this.tabBar!.appendChild(button);
    });

    this.activeTabContainer = DomHelpers.createElement("section", "corvo-body");

    this.shell.append(header, this.tabBar, this.activeTabContainer);
    this.contentEl.appendChild(this.shell);
  }

  /**
   * Updates the header actions with current data.
   */
  private async updateHeader(data: CorvoPluginData): Promise<void> {
    if (!this.headerActions) return;

    const activeContest = data.contests.find((contest) => contest.id === data.activeContestId);
    this.headerActions.innerHTML = "";
    this.headerActions.appendChild(
      DomHelpers.createBadge(activeContest ? `Concurso ativo: ${activeContest.name}` : "Nenhum concurso ativo")
    );
  }

  /**
   * Updates the active tab button styles and renders the active tab content.
   */
  private async updateActiveTab(data: CorvoPluginData): Promise<void> {
    if (!this.activeTabContainer) return;

    this.updateTabButtonStyles();
    this.activeTabContainer.innerHTML = "";
    await this.renderActiveTab(this.activeTabContainer, data);
  }

  /**
   * Updates the active class on tab buttons.
   */
  private updateTabButtonStyles(): void {
    this.tabButtons.forEach((button, tabId) => {
      button.className = this.activeTab === tabId
        ? "corvo-tab-button is-active"
        : "corvo-tab-button";
    });
  }

  private async renderActiveTab(container: HTMLElement, data: CorvoPluginData): Promise<void> {
    switch (this.activeTab) {
      case "dashboard":
        await this.dashboardTab.render(container, data);
        break;
      case "contests":
        await this.contestsTab.render(container, data);
        break;
      case "cycle":
        await this.cycleTab.render(container, data);
        break;
      case "items":
        await this.itemsTab.render(container, data);
        break;
      case "topics":
        await this.topicsTab.render(container, data);
        break;
      case "sessions":
        await this.sessionsTab.render(container, data);
        break;
      case "wall":
        await this.wallTab.render(container, data);
        break;
    }
  }

  private getSelectedSubject(data: CorvoPluginData): { id: string; name: string } | null {
    const subjects = data.subjects
      .filter((subject) => subject.contestId === data.activeContestId)
      .sort((left, right) => left.order - right.order);

    if (subjects.length === 0) {
      return null;
    }

    return subjects.find((subject) => subject.id === this.selectedSubjectId) ?? subjects[0];
  }

  private ensureSelectedSubject(data: CorvoPluginData): void {
    const selectedSubject = this.getSelectedSubject(data);
    this.selectedSubjectId = selectedSubject?.id ?? null;
  }
}