import type { PluginDataStore } from "@/application/ports/PluginDataStore";
import { CreateContestUseCase } from "@/application/use-cases/CreateContestUseCase";
import { SetActiveContestUseCase } from "@/application/use-cases/SetActiveContestUseCase";
import type { CorvoPluginData } from "@/domain/types/CorvoPluginData";
import { DomHelpers } from "@/ui/view/shared/DomHelpers";
import { Notice } from "obsidian";

/**
 * Contests tab component - shows contest list and creation form.
 */
export class ContestsTab {
  private readonly createContestUseCase: CreateContestUseCase;
  private readonly setActiveContestUseCase: SetActiveContestUseCase;

  constructor(
    private readonly dataStore: PluginDataStore,
    private readonly onUpdate: () => Promise<void>
  ) {
    this.createContestUseCase = new CreateContestUseCase(dataStore);
    this.setActiveContestUseCase = new SetActiveContestUseCase(dataStore);
  }

  /**
   * Renders the contests tab content.
   */
  async render(container: HTMLElement, data: CorvoPluginData): Promise<void> {
    container.appendChild(DomHelpers.createSectionTitle("Concursos"));
    container.appendChild(
      DomHelpers.createParagraph("Cadastre concursos e defina qual deles está ativo.")
    );
    container.appendChild(
      DomHelpers.createDisclosure("Novo concurso", this.renderCreateContestForm())
    );

    const contestsCard = DomHelpers.createCard("Lista de concursos");
    if (data.contests.length === 0) {
      contestsCard.appendChild(DomHelpers.createParagraph("Nenhum concurso cadastrado."));
    }

    data.contests.forEach((contest) => {
      const row = DomHelpers.createElement("div", "corvo-list-row");
      const info = DomHelpers.createElement("div", "corvo-stack");
      info.append(
        DomHelpers.createStrong(contest.name),
        DomHelpers.createParagraph(`ID: ${contest.id}`),
        DomHelpers.createParagraph(contest.wall.notes ?? "Sem observações no mural.")
      );

      const actions = DomHelpers.createElement("div", "corvo-inline-actions");
      if (data.activeContestId === contest.id) {
        actions.appendChild(DomHelpers.createBadge("Ativo"));
      } else {
        actions.appendChild(
          DomHelpers.createButton(`Ativar ${contest.name}`, {
            onClick: async () => {
              try {
                await this.setActiveContestUseCase.execute({ contestId: contest.id });
                await this.onUpdate();
              } catch (error) {
                this.notifyError(error, "Não foi possível ativar o concurso.");
              }
            }
          })
        );
      }

      row.append(info, actions);
      contestsCard.appendChild(row);
    });

    container.appendChild(contestsCard);
  }

  /**
   * Renders the create contest form.
   */
  private renderCreateContestForm(): HTMLElement {
    const form = DomHelpers.createForm(async (event) => {
      const idInput = form.querySelector<HTMLInputElement>("[data-field='id']");
      const nameInput = form.querySelector<HTMLInputElement>("[data-field='name']");

      if (!idInput || !nameInput) {
        return;
      }

      try {
        await this.createContestUseCase.execute({
          id: idInput.value.trim(),
          name: nameInput.value.trim()
        });
        idInput.value = "";
        nameInput.value = "";
        await this.onUpdate();
      } catch (error) {
        this.notifyError(error, "Não foi possível criar o concurso.");
      }
    });

    const idInput = DomHelpers.createInput("text", "ID do concurso");
    idInput.dataset.field = "id";
    const nameInput = DomHelpers.createInput("text", "Nome do concurso");
    nameInput.dataset.field = "name";

    form.append(
      DomHelpers.createLabel("ID", idInput),
      DomHelpers.createLabel("Nome", nameInput),
      DomHelpers.createButton("Criar concurso", {
        type: "submit",
        className: "corvo-primary-button"
      })
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
