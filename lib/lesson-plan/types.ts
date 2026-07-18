export type LessonPlanSourceType = "manual" | "document" | "slide_deck" | "worksheet" | "exam" | "solution" | "rubric" | "previous_lesson_plan";
export type LessonPlanInputMode = "topic" | "document" | "saved" | "existing";
export type LessonType = "new_lesson" | "practice" | "review" | "solution" | "experiment" | "assessment" | "experience" | "summary";
export type LessonDetailLevel = "short" | "standard" | "detailed";
export type LessonLayout = "activities" | "teacher_student_table" | "timeline" | "simple";
export type LessonWorkMode = "individual" | "pair" | "group" | "whole_class" | "mixed";
export type LessonPhase = "warm_up" | "knowledge" | "practice" | "application" | "consolidation" | "homework" | "assessment" | "other";
export type ObjectiveCategory = "knowledge" | "skill" | "competency" | "quality" | "other";
export type LessonGenerationStatus = "outline" | "generating" | "ready" | "failed";
export type LessonAssessmentMethod = "observation" | "oral_question" | "worksheet" | "quick_quiz" | "product" | "peer" | "self" | "rubric" | "exit_ticket";

export type LessonObjective = { id:string; category:ObjectiveCategory; content:string; evidence?:string };
export type LessonPreparation = { teacher:string[]; students:string[]; equipment:string[]; materials:string[] };
export type ActivityStep = { id:string; name:string; teacherAction:string; studentAction:string; output?:string };
export type LinkedMaterial = { id:string; type:"slide_deck"|"worksheet"|"rubric"|"exam"|"question_bank"|"image"|"tikz"|"document"|"external_link"; title:string; documentId?:string; url?:string };
export type ActivityDifferentiation = { support?:string; standard?:string; advanced?:string; hint?:string; reducedItemCount?:number; additionalMinutes?:number; alternativeOutput?:string; groupRoleSupport?:string };

export type LessonActivity = {
  id:string; order:number; phase:LessonPhase; title:string; durationMinutes:number;
  objectiveIds:string[]; content:string; steps:ActivityStep[];
  teacherActions:ActivityStep[]; studentActions:ActivityStep[];
  expectedProduct?:string; assessmentMethod?:LessonAssessmentMethod; assessmentCriteria?:string;
  assessmentEvidence?:string; feedbackMethod?:string; workMode:LessonWorkMode;
  materials?:LinkedMaterial[]; differentiation?:ActivityDifferentiation; teacherNote?:string;
  generationStatus?:LessonGenerationStatus; generationError?:string; teacherEdited?:boolean;
};

export type LessonPeriod = { id:string; periodNumber:number; title?:string; durationMinutes:number; activities:LessonActivity[] };
export type LessonAssessmentPlan = { methods:LessonAssessmentMethod[]; notes?:string };
export type DifferentiationPlan = { mode:"none"|"support"|"basic_advanced"|"three_levels"|"product"|"time"; notes?:string };
export type HomeworkPlan = { task:string; purpose?:string; expectedProduct?:string; deadline?:string; differentiation?:string; nextLessonPreparation?:string };
export type LessonPlanSettings = {
  detailLevel:LessonDetailLevel; layout:LessonLayout; defaultWorkMode:LessonWorkMode;
  sourceOnly:boolean; includeWarmUp:boolean; includeKnowledge:boolean; includePractice:boolean;
  includeApplication:boolean; includeConsolidation:boolean; includeHomework:boolean;
  includeAssessment:boolean; includeSlideGuide:boolean; includeWorksheet:boolean;
  includeRubric:boolean; includeExpectedProducts:boolean;
};
export type LessonPlanMetadata = {
  sourceType:LessonPlanSourceType; sourceDocumentId?:string; sourceTitle?:string; sourceHash?:string;
  createdAt:string; updatedAt:string; version?:string; validationStatus?:"ready"|"warning"|"blocked";
};
export type LessonPlan = {
  id?:string; ownerId?:string; title:string; subject?:string; grade?:string; topic?:string; textbookSeries?:string;
  lessonType:LessonType; periodCount:number; minutesPerPeriod:number;
  objectives:LessonObjective[]; preparation:LessonPreparation; periods:LessonPeriod[];
  diagramAssets?:import("@/lib/tikz/types").ConfirmedDiagramAsset[];
  assessmentPlan?:LessonAssessmentPlan; differentiation?:DifferentiationPlan; homework?:HomeworkPlan;
  linkedMaterials?:{slideDeckIds?:string[];worksheetIds?:string[];rubricIds?:string[];examIds?:string[];documentIds?:string[]};
  requirements?:string[]; keyKnowledge?:string[]; methods?:string[]; classProfile?:string; notes?:string;
  settings:LessonPlanSettings; metadata:LessonPlanMetadata;
};

export type LessonPlanSourcePreview = {
  title:string; sourceType:LessonPlanSourceType; sourceDocumentId?:string; subject?:string; grade?:string; topic?:string;
  objectives:string[]; concepts:string[]; examples:string[]; exercises:string[]; text:string; confirmed:boolean; warnings:string[];
};
export type LessonTimingResult = { periodId:string; periodNumber:number; configured:number; actual:number; difference:number; status:"match"|"under"|"over"|"adjust"; message:string };
export type ObjectiveCoverage = { objectiveId:string; objective:string; activityTitles:string[]; evidence:string[]; status:"covered"|"missing_activity"|"missing_evidence"|"needs_confirmation" };
