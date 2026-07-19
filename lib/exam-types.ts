import type { QuestionDifficulty } from "@/lib/types";

export type ExamPartType = "multiple_choice" | "true_false" | "short_answer";

export type ExamQuestion = {
  id: string;
  part: ExamPartType;
  number: number;
  stem: string;
  options?: Record<"A" | "B" | "C" | "D", string>;
  trueFalseItems?: { id?: string; label: "a" | "b" | "c" | "d"; text: string; answer: boolean }[];
  answer: string;
  explanation: string;
  score: number;
  difficulty: QuestionDifficulty;
  topic: string;
  cognitiveLevel?: QuestionDifficulty;
  shortAnswer?: {
    displayText: string;
    canonicalValue?: number;
    acceptedForms?: string[];
    tolerance?: number;
    unit?: string;
    roundingInstruction?: string;
  };
  visuals?: {
    type: "image" | "figure" | "chart" | "table" | "tikz" | "svg";
    content?: string;
    alt?: string;
  }[];
  sourceMetadata?: Record<string, unknown>;
};

export type StructuredExam = {
  diagramAssets?: import("@/lib/tikz/types").ConfirmedDiagramAsset[];
  metadata: {
    title: string;
    examStyle: string;
    subject: string;
    grade: string;
    duration: string;
    examCode: string;
    schoolName?: string;
    examType?: string;
    totalScore?: number;
    requestedSectionCounts?: { partI: number; partII: number; partIII: number };
    requestedCognitiveRates?: {
      recognition: number;
      understanding: number;
      application: number;
      advanced: number;
    };
    importWarnings?: string[];
  };
  parts: {
    type: ExamPartType;
    title: string;
    instruction: string;
    questions: ExamQuestion[];
  }[];
  teacherOnly: {
    scoringGuide: string;
    matrix: string;
    specification: string;
    notes: string;
  };
};
