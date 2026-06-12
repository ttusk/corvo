import type { PluginDataStore } from "@/application/ports/PluginDataStore";
import { CsvExportService } from "@/domain/services/CsvExportService";
import type { LeifPluginData } from "@/domain/types/LeifPluginData";

export type ExportEntityType = "sessions" | "items" | "topics" | "subjects" | "contests";

export interface ExportToCsvInput {
  entityType: ExportEntityType;
  contestId?: string;
  subjectId?: string;
}

/**
 * Use case for exporting plugin data to CSV.
 */
export class ExportToCsvUseCase {
  constructor(private readonly dataStore: PluginDataStore) {}

  async execute(input: ExportToCsvInput): Promise<void> {
    const data = await this.dataStore.load();
    const contestId = input.contestId ?? data.activeContestId;

    switch (input.entityType) {
      case "sessions":
        return this.exportSessions(data, contestId);
      case "items":
        return this.exportItems(data, input.subjectId);
      case "topics":
        return this.exportTopics(data, input.subjectId);
      case "subjects":
        return this.exportSubjects(data, contestId);
      case "contests":
        return this.exportContests(data);
    }
  }

  private exportSessions(data: LeifPluginData, contestId: string | null): void {
    const sessions = data.studySessions
      .filter((s) => (contestId ? s.contestId === contestId : true))
      .map((s) => {
        const subject = data.subjects.find((sub) => sub.id === s.subjectId);
        const topic = data.topics.find((t) => t.id === s.topicId);
        const item = data.studyItems.find((i) => i.id === s.studyItemId);

        return {
          Data: new Date(s.studiedAt).toLocaleDateString("pt-BR"),
          Matéria: subject?.name ?? "",
          Assunto: topic?.name ?? "",
          Item: item?.title ?? "",
          Tipo: s.type,
          Quantidade: s.pagesOrCount ?? 0,
          Acertos: s.correctAnswers ?? 0,
          Concluído: s.completed ? "Sim" : "Não"
        };
      });

    const csv = CsvExportService.export(sessions);
    CsvExportService.download(csv, `sessoes-${contestId ?? "todos"}`);
  }

  private exportItems(data: LeifPluginData, subjectId?: string): void {
    const items = data.studyItems
      .filter((i) => (subjectId ? i.subjectId === subjectId : true))
      .map((i) => {
        const subject = data.subjects.find((s) => s.id === i.subjectId);

        return {
          Ordem: i.order,
          Matéria: subject?.name ?? "",
          Item: i.title,
          Peso: i.weight ?? 0,
          "Total Questões": i.questionCount ?? 0,
          Referências: i.resourceReferences?.length ?? 0
        };
      });

    const csv = CsvExportService.export(items);
    CsvExportService.download(csv, `itens-${subjectId ?? "todos"}`);
  }

  private exportTopics(data: LeifPluginData, subjectId?: string): void {
    const topics = data.topics
      .filter((t) => (subjectId ? t.subjectId === subjectId : true))
      .map((t) => {
        const subject = data.subjects.find((s) => s.id === t.subjectId);

        return {
          Matéria: subject?.name ?? "",
          Assunto: t.name,
          Caderno: t.questionNotebook?.name ?? "",
          Resolvidas: t.questionNotebook?.solvedQuestions ?? 0,
          Acertos: t.questionNotebook?.correctAnswers ?? 0
        };
      });

    const csv = CsvExportService.export(topics);
    CsvExportService.download(csv, `assuntos-${subjectId ?? "todos"}`);
  }

  private exportSubjects(data: LeifPluginData, contestId: string | null): void {
    const subjects = data.subjects
      .filter((s) => (contestId ? s.contestId === contestId : true))
      .map((s) => ({
        Ordem: s.order,
        Nome: s.name,
        "Minutos Planejados": s.plannedStudyMinutes,
        Etapa: s.currentStage ?? "",
        Ativa: s.isActive ? "Sim" : "Não",
        "Total Itens": data.studyItems.filter((i) => i.subjectId === s.id).length,
        "Total Assuntos": data.topics.filter((t) => t.subjectId === s.id).length
      }));

    const csv = CsvExportService.export(subjects);
    CsvExportService.download(csv, `materias-${contestId ?? "todos"}`);
  }

  private exportContests(data: LeifPluginData): void {
    const contests = data.contests.map((c) => ({
      ID: c.id,
      Nome: c.name,
      Notas: c.wall.notes ?? "",
      "Links Edital": c.wall.noticeLinks.length,
      "Links Prova": c.wall.examLinks.length,
      "Snapshots Matérias": c.wall.subjectSnapshots.length,
      Ativo: data.activeContestId === c.id ? "Sim" : "Não"
    }));

    const csv = CsvExportService.export(contests);
    CsvExportService.download(csv, "concursos");
  }
}
