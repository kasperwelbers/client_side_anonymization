export interface NamedEntity {
  entity: string;
  score: number;
  index: number;
  start: number;
  end: number;
  word: string;
}
export type NER = NamedEntity[];

export type ModelStatus = "idle" | "loading" | "ready" | "error";
export type NERCallback = (ner: NER[]) => void;
export type ProgressCallback = (percent: number) => void;
