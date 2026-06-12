import { Notice } from "obsidian";
import type { PluginDataStore } from "@/application/ports/PluginDataStore";
import { AddStudyItemResourceReferenceUseCase } from "@/application/use-cases/AddStudyItemResourceReferenceUseCase";
import { CreateStudyItemUseCase } from "@/application/use-cases/CreateStudyItemUseCase";
import { GetActiveContestProgressDashboardUseCase } from "@/application/use-cases/GetActiveContestProgressDashboardUseCase";
import type { CorvoPluginData } from "@/domain/types/CorvoPluginData";
import { DomHelpers } from "@/ui/view/shared/DomHelpers";

/**
 * Items tab component - manages study items and their resource references.
 */
export class ItemsTab {
  private readonly createStudyItemUseCase: CreateStudyItemUseCase;
  private readonly addStudyItemResourceReferenceUseCase: AddStudyItemResourceReferenceUseCase;
  private readonly getActiveContestProgressDashboardUseCase: GetActiveContestProgressDashboardUseCase;

  private selectedSubjectId: string | null = null;

  constructor(
    private readonly dataStore: PluginDataStore,
    private readonly onUpdate: () => Promise<void>
  ) {
    this.createStudyItemUseCase = new CreateStudyItemUseCase(dataStore);
    this.addStudyItemResourceReferenceUseCase = new AddStudyItemResourceReferenceUseCase(dataStore);
    this.getActiveContestProgressDashboardUseCase = new GetActiveContestProgressDashboardUseCase(dataStore);
  }

  /**
   * Renders the items tab content.
   */
  async render(container: HTMLElement, data: CorvoPluginData): Promise<void> {
    container.appendChild(DomHelpers.createSectionTitle("Itens e PDFs"));

    const subject = this.getSelectedSubject(data);
    if (!subject) {
      container.appendChild(
        DomHelpers.createEmptyState(
          "Nenhuma matéria selecionada",
          "Cadastre matérias no concurso ativo."
        )
      );
      return;
    }

    container.appendChild(this.renderSubjectPicker(data));
    container.appendChild(DomHelpers.createDisclosure("Novo item", this.renderCreateItemForm(subject.id)));

    const progress = await this.getActiveContestProgressDashboardUseCase.execute();
    const subjectProgress = progress.pdfProgressBySubject.find((entry) => entry.subjectId === subject.id);
    const items = data.studyItems
      .filter((studyItem) => studyItem.subjectId === subject.id)
      .sort((left, right) => left.order - right.order);

    const card = DomHelpers.createCard(`Itens de ${subject.name}`);
    if (items.length === 0) {
      card.appendChild(DomHelpers.createParagraph("Nenhum item cadastrado."));
    }

    if (items.length > 0) {
      card.appendChild(
        DomHelpers.createTable(
          ["Ordem", "Item", "Peso", "Questões", "PDF", "Referências"],
          items.map((item) => {
            const itemProgress = subjectProgress?.items.find((entry) => entry.studyItemId === item.id);
            return [
              String(item.order),
              item.title,
              String(item.weight ?? 0),
              String(item.questionCount ?? 0),
              String(itemProgress?.progressCount ?? 0),
              String((item.resourceReferences ?? []).length)
            ];
          })
        )
      );
    }

    items.forEach((item) => {
      const itemProgress = subjectProgress?.items.find((entry) => entry.studyItemId === item.id);
      const wrapper = DomHelpers.createElement("div", "corvo-stack corvo-card-subsection");
      wrapper.append(
        DomHelpers.createStrong(`${item.order}. ${item.title}`),
        DomHelpers.createKeyValueRow("Peso", String(item.weight ?? 0)),
        DomHelpers.createKeyValueRow("Questões", String(item.questionCount ?? 0)),
        DomHelpers.createKeyValueRow("PDF realizado", String(itemProgress?.progressCount ?? 0))
      );

      (item.resourceReferences ?? []).forEach((resource) => {
        wrapper.appendChild(DomHelpers.createKeyValueRow(resource.type, resource.title));
      });

      const titleInput = DomHelpers.createInput("text", "Título da referência");
      const typeSelect = DomHelpers.createSelect([
        ["pdf", "pdf"],
        ["video", "video"],
        ["link", "link"],
        ["question-notebook", "question-notebook"]
      ]);
      const urlInput = DomHelpers.createInput("url", "URL");

      const form = DomHelpers.createForm(async () => {
        try {
          await this.addStudyItemResourceReferenceUseCase.execute({
            studyItemId: item.id,
            resourceReference: {
              id: `${item.id}-resource-${Date.now()}`,
              title: titleInput.value,
              type: typeSelect.value as "pdf" | "video" | "link" | "question-notebook",
              url: urlInput.value
            }
          });
          await this.onUpdate();
        } catch (error) {
          this.notifyError(error, "Não foi possível adicionar a referência.");
        }
      });

      form.append(
        DomHelpers.createLabel("Título", titleInput),
        DomHelpers.createLabel("Tipo", typeSelect),
        DomHelpers.createLabel("URL", urlInput),
        DomHelpers.createButton("Adicionar referência", { type: "submit" })
      );

      wrapper.appendChild(DomHelpers.createDisclosure("Adicionar referência", form));
      card.appendChild(wrapper);
    });

    container.appendChild(card);
  }

  /**
   * Returns the currently selected subject, or the first subject with active contest.
   */
  private getSelectedSubject(data: CorvoPluginData): { id: string; name: string } | null {
    const subjects = data.subjects
      .filter((subject) => subject.contestId === data.activeContestId)
      .sort((left, right) => left.order - right.order);

    if (subjects.length === 0) {
      return null;
    }

    return subjects.find((subject) => subject.id === this.selectedSubjectId) ?? subjects[0];
  }

  /**
   * Renders the subject picker dropdown.
   */
  private renderSubjectPicker(data: CorvoPluginData): HTMLElement {
    const subjects = data.subjects
      .filter((subject) => subject.contestId === data.activeContestId)
      .sort((left, right) => left.order - right.order);

    const select = DomHelpers.createSelect(
      subjects.map((subject) => [subject.id, subject.name]),
      this.selectedSubjectId ?? undefined
    );
    select.addEventListener("change", async () => {
      this.selectedSubjectId = select.value;
      await this.onUpdate();
    });

    const wrapper = DomHelpers.createElement("div", "corvo-toolbar");
    wrapper.appendChild(DomHelpers.createLabel("Matéria", select));
    return wrapper;
  }

  /**
   * Renders the form for creating a new study item.
   */
  private renderCreateItemForm(subjectId: string): HTMLElement {
    const titleInput = DomHelpers.createInput("text", "Título do item");
    const weightInput = DomHelpers.createInput("number", "Peso", "1");
    const questionCountInput = DomHelpers.createInput("number", "Total de questões", "0");

    const form = DomHelpers.createForm(async () => {
      try {
        await this.createStudyItemUseCase.execute({
          id: `${subjectId}-item-${Date.now()}`,
          subjectId,
          title: titleInput.value,
          weight: Number(weightInput.value),
          questionCount: Number(questionCountInput.value)
        });
        await this.onUpdate();
      } catch (error) {
        this.notifyError(error, "Não foi possível criar o item.");
      }
    });

    form.append(
      DomHelpers.createLabel("Título", titleInput),
      DomHelpers.createLabel("Peso", weightInput),
      DomHelpers.createLabel("Questões", questionCountInput),
      DomHelpers.createButton("Criar item", { type: "submit", className: "corvo-primary-button" })
    );

    return form;
  }

  /**
   * Displays an error notification.
   */
  private notifyError(error: unknown, fallbackMessage: string): void {
    new Notice(error instanceof Error ? error.message : fallbackMessage);
  }
}
