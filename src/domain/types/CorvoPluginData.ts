import type { Contest } from "@/domain/entities/Contest";
import type { ContestState } from "@/domain/entities/ContestState";
import type { StudyItem } from "@/domain/entities/StudyItem";
import type { StudySession } from "@/domain/entities/StudySession";
import type { Subject } from "@/domain/entities/Subject";
import type { Topic } from "@/domain/entities/Topic";

export interface CorvoPluginData {
  version: 1;
  schemaVersion?: number;
  activeContestId: string | null;
  contests: Contest[];
  contestStates: ContestState[];
  subjects: Subject[];
  topics: Topic[];
  studyItems: StudyItem[];
  studySessions: StudySession[];
}

export function createDefaultCorvoPluginData(): CorvoPluginData {
  return {
    version: 1,
    schemaVersion: 1,
    activeContestId: null,
    contests: [],
    contestStates: [],
    subjects: [],
    topics: [],
    studyItems: [],
    studySessions: []
  };
}
