import { PluginSettingTab } from "obsidian";

import type CorvoPlugin from "@/main";
import { openCorvoView } from "@/ui/view/registerCorvoView";

export class CorvoSettingTab extends PluginSettingTab {
  constructor(app: CorvoPlugin["app"], private readonly corvoPlugin: CorvoPlugin) {
    super(app, corvoPlugin);
  }

  override display(): void {
    this.containerEl.innerHTML = "";

    const wrapper = document.createElement("div");
    wrapper.className = "corvo-settings";

    const title = document.createElement("h2");
    title.textContent = "Corvo";

    const description = document.createElement("p");
    description.textContent =
      "O Corvo é aberto em uma visualização própria dentro do Obsidian. Use o botão abaixo para acessar o painel principal.";

    const openButton = document.createElement("button");
    openButton.type = "button";
    openButton.className = "mod-cta";
    openButton.textContent = "Abrir painel do Corvo";
    openButton.addEventListener("click", async () => {
      await openCorvoView(this.corvoPlugin);
    });

    const help = document.createElement("p");
    help.textContent =
      "Você também pode abrir o plugin pela faixa lateral esquerda ou pela paleta de comandos, usando o comando “Corvo: Abrir painel do Corvo”.";

    wrapper.append(title, description, openButton, help);
    this.containerEl.appendChild(wrapper);
  }
}
