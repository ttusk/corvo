import { Notice } from "obsidian";
import type { PluginDataStore } from "@/application/ports/PluginDataStore";
import { AddTopicResourceReferenceUseCase } from "@/application/use-cases/AddTopicResourceReferenceUseCase";
import { CreateTopicUseCase } from "@/application/use-cases/CreateTopicUseCase";
import { LinkQuestionNotebookUseCase } from "@/application/use-cases/LinkQuestionNotebookUseCase";
import type { CorvoPluginData } from "@/domain/types/CorvoPluginData";
import { DomHelpers } from "@/ui/view/shared/DomHelpers";

/**
 * Topics tab component - manages topics, resource references, and question notebooks.
 */
export class TopicsTab {
  private readonly createTopicUseCase: CreateTopicUseCase;
  private readonly addTopicResourceReferenceUseCase: AddTopicResourceReferenceUseCase;
  private readonly linkQuestionNotebookUseCase: LinkQuestionNotebookUseCase;

  private selectedSubjectId: string | null = null;

  constructor(
    private readonly dataStore: PluginDataStore,
    private readonly onUpdate: () => Promise<void>
  ) {
    this.createTopicUseCase = new CreateTopicUseCase(dataStore);
    this.addTopicResourceReferenceUseCase = new AddTopicResourceReferenceUseCase(dataStore);
    this.linkQuestionNotebookUseCase = new LinkQuestionNotebookUseCase(dataStore);
  }

  /**
   * Renders the topics tab content.
   */
  async render(container: HTMLElement, data: CorvoPluginData): Promise<void> {
    container.appendChild(DomHelpers.createSectionTitle("Assuntos e Questões"));

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
    container.appendChild(
      DomHelpers.createDisclosure("Novo assunto", this.renderCreateTopicForm(subject.id))
    );

    const topics = data.topics
      .filter((topic) => topic.subjectId === subject.id)
      .sort((left, right) => left.order - right.order);

    const card = DomHelpers.createCard(`Assuntos de ${subject.name}`);
    if (topics.length === 0) {
      card.appendChild(DomHelpers.createParagraph("Nenhum assunto cadastrado."));
    }

    if (topics.length > 0) {
      card.appendChild(
        DomHelpers.createTable(
          ["Ordem", "Assunto", "Caderno", "Resolvidas", "Acertos", "Referências"],
          topics.map((topic) => [
            String(topic.order),
            topic.name,
            topic.questionNotebook?.name ?? "-",
            String(topic.questionNotebook?.solvedQuestions ?? 0),
            String(topic.questionNotebook?.correctAnswers ?? 0),
            String(topic.resourceReferences.length)
          ])
        )
      );
    }

    topics.forEach((topic) => {
      const wrapper = DomHelpers.createElement("div", "corvo-stack corvo-card-subsection");
      wrapper.append(
        DomHelpers.createStrong(`${topic.order}. ${topic.name}`),
        topic.questionNotebook
          ? DomHelpers.createKeyValueRow(
              "Caderno",
              `${topic.questionNotebook.name} | Resolvidas ${topic.questionNotebook.solvedQuestions} | Acertos ${topic.questionNotebook.correctAnswers}`
            )
          : DomHelpers.createParagraph("Sem caderno vinculado.")
      );

      topic.resourceReferences.forEach((resource) => {
        wrapper.appendChild(DomHelpers.createKeyValueRow(resource.type, resource.title));
      });

      const resourceTitle = DomHelpers.createInput("text", "Título da referência");
      const resourceType = DomHelpers.createSelect([
        ["pdf", "pdf"],
        ["video", "video"],
        ["link", "link"],
        ["question-notebook", "question-notebook"]
      ]);
      const resourceUrl = DomHelpers.createInput("url", "URL");

      const resourceForm = DomHelpers.createForm(async () => {
        try {
          await this.addTopicResourceReferenceUseCase.execute({
            topicId: topic.id,
            resourceReference: {
              id: `${topic.id}-resource-${Date.now()}`,
              title: resourceTitle.value,
              type: resourceType.value as "pdf" | "video" | "link" | "question-notebook",
              url: resourceUrl.value
            }
          });
          await this.onUpdate();
        } catch (error) {
          this.notifyError(error, "Não foi possível adicionar referência.");
        }
      });

      resourceForm.append(
        DomHelpers.createLabel("Título", resourceTitle),
        DomHelpers.createLabel("Tipo", resourceType),
        DomHelpers.createLabel("URL", resourceUrl),
        DomHelpers.createButton("Adicionar referência", { type: "submit" })
      );

      const notebookName = DomHelpers.createInput("text", "Nome do caderno", topic.questionNotebook?.name ?? "");
      const notebookSolved = DomHelpers.createInput("number", "Resolvidas", String(topic.questionNotebook?.solvedQuestions ?? 0));
      const notebookCorrect = DomHelpers.createInput("number", "Acertos", String(topic.questionNotebook?.correctAnswers ?? 0));

      const notebookForm = DomHelpers.createForm(async () => {
        try {
          await this.linkQuestionNotebookUseCase.execute({
            topicId: topic.id,
            questionNotebook: {
              id: topic.questionNotebook?.id ?? `${topic.id}-notebook`,
              name: notebookName.value,
              url: topic.questionNotebook?.url ?? "",
              solvedQuestions: Number(notebookSolved.value),
              correctAnswers: Number(notebookCorrect.value)
            }
          });
          await this.onUpdate();
        } catch (error) {
          this.notifyError(error, "Não foi possível vincular caderno.");
        }
      });

      notebookForm.append(
        DomHelpers.createLabel("Nome do caderno", notebookName),
        DomHelpers.createLabel("Resolvidas", notebookSolved),
        DomHelpers.createLabel("Acertos", notebookCorrect),
        DomHelpers.createButton("Vincular caderno", { type: "submit" })
      );

      wrapper.append(
        DomHelpers.createDisclosure("Adicionar referência", resourceForm),
        DomHelpers.createDisclosure("Vincular caderno", notebookForm)
      );
      card.appendChild(wrapper);
    });

    container.appendChild(card);
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
   * Renders the form for creating a new topic.
   */
  private renderCreateTopicForm(subjectId: string): HTMLElement {
    const nameInput = DomHelpers.createInput("text", "Nome do assunto");
    const orderInput = DomHelpers.createInput("number", "Ordem", "1");

    const form = DomHelpers.createForm(async () => {
      try {
        await this.createTopicUseCase.execute({
          id: `${subjectId}-topic-${Date.now()}`,
          subjectId,
          name: nameInput.value,
          order: Number(orderInput.value)
        });
        await this.onUpdate();
      } catch (error) {
        this.notifyError(error, "Não foi possível criar o assunto.");
      }
    });

    form.append(
      DomHelpers.createLabel("Nome", nameInput),
      DomHelpers.createLabel("Ordem", orderInput),
      DomHelpers.createButton("Criar assunto", { type: "submit", className: "corvo-primary-button" })
    );

    return form;
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
   * Displays an error notification.
   */
  private notifyError(error: unknown, fallbackMessage: string): void {
    new Notice(error instanceof Error ? error.message : fallbackMessage);
  }
}
