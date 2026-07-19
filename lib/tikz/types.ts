export type DiagramClass =
  | "solid_geometry"
  | "plane_geometry"
  | "function_graph"
  | "coordinate_geometry"
  | "line_angle_diagram"
  | "circle_geometry_with_background"
  | "statistical_chart"
  | "physics_diagram"
  | "formula_or_text"
  | "unknown";

export type DiagramObjectType =
  | "point" | "label" | "segment" | "ray" | "line" | "vector" | "polygon"
  | "polyhedron_face" | "circle" | "arc" | "angle_marker" | "right_angle_marker"
  | "axis" | "tick" | "grid" | "function_curve" | "plotted_point" | "asymptote"
  | "bar" | "chart_label" | "force_arrow" | "circuit_element" | "optics_ray"
  | "table" | "annotation" | "unknown";

export type DiagramRelationshipType =
  | "connected_to" | "lies_on" | "collinear" | "parallel" | "perpendicular"
  | "intersects" | "midpoint_of" | "center_of" | "tangent_to" | "hidden_edge"
  | "visible_edge" | "equal_length" | "equal_angle" | "shared_context"
  | "label_for" | "endpoint_of" | "vertex_of" | "lies_on_circle"
  | "inside_circle" | "outside_circle" | "radius_of" | "diameter_of"
  | "chord_of" | "secant_of" | "angle_between";

export type DiagramPoint = { x: number; y: number };
export type DiagramBounds = { minX: number; minY: number; maxX: number; maxY: number };
export type SourceBox = { x: number; y: number; width: number; height: number };

export type TikzPreprocessingSettings = {
  rotation: -90 | 0 | 90 | 180;
  perspectiveCorrection: boolean;
  deskew: boolean;
  grayscale: boolean;
  contrast: "normal" | "enhanced";
  thresholdMode: "none" | "adaptive";
  denoise: boolean;
  lineEnhancement: boolean;
  useOriginal: boolean;
  cropBounds?: SourceBox;
};

export type PrivateTikzAssetRef = {
  id: string;
  kind: "source" | "svg" | "png" | "pdf";
  mimeType: string;
  size: number;
  hash: string;
  width?: number;
  height?: number;
  createdAt: string;
  updatedAt: string;
};

export type ConfirmedDiagramAsset = {
  diagramId: string;
  version: string;
  semanticHash: string;
  tikzSource: string;
  standaloneSource: string;
  svgAssetId?: string;
  pngAssetId?: string;
  pdfAssetId?: string;
  svgDataUrl?: string;
  pngDataUrl?: string;
  altText: string;
  caption?: string;
  width: number;
  height: number;
  confirmedAt: string;
};

export type DiagramDocumentReference = {
  documentId: string;
  documentType: "exam" | "question-bank" | "worksheet" | "lesson-plan" | "lesson-slides" | "review-pack" | "answer-solutions";
  locationId: string;
  diagramVersion: string;
  insertedAt: string;
};

export type TikzReviewItem = {
  id: string;
  category: "label" | "hidden_edge" | "relationship" | "intersection" | "marker" | "unknown_object";
  objectId?: string;
  relationshipId?: string;
  message: string;
  blocking: boolean;
  status: "pending" | "confirmed" | "ignored" | "keep_source";
};

export type DiagramObject = {
  id: string;
  type: DiagramObjectType;
  label?: string;
  text?: string;
  position?: DiagramPoint;
  points?: string[];
  coordinates?: DiagramPoint[];
  radius?: number;
  value?: number;
  style?: "solid" | "dashed" | "dotted";
  anchor?: "above" | "below" | "left" | "right" | "above left" | "above right" | "below left" | "below right";
  sourceBox?: SourceBox;
  confidence: "high" | "medium" | "low";
  teacherConfirmed: boolean;
  metadata?: Record<string, string | number | boolean | string[]>;
};

export type DiagramRelationship = {
  id: string;
  type: DiagramRelationshipType;
  objectIds: string[];
  label?: string;
  confidence: "high" | "medium" | "low";
  teacherConfirmed: boolean;
};

export type TikzCompilationResult = {
  available: boolean;
  success: boolean;
  engine: "latex" | "deterministic_preview" | "none";
  warnings: string[];
  errors: Array<{ code: string; line?: number; message: string; suggestion?: string }>;
  renderedAsset?: { type: "svg" | "png" | "pdf"; dataUrl?: string };
  width?: number;
  height?: number;
  compileTimeMs?: number;
  supportsPdf?: boolean;
  supportsSvg?: boolean;
  verifiedOutput?: boolean;
};

export type TikzValidationResult = {
  valid: boolean;
  status: "ready" | "warning" | "needs_review" | "unreliable";
  checks: Array<{ code: string; passed: boolean; severity: "info" | "warning" | "error"; message: string; objectIds?: string[] }>;
  warnings: string[];
  missingObjects: string[];
};

export type DiagramComparisonResult = {
  objectCoverage: number;
  labelCoverage: number;
  structuralSimilarity: number;
  sourceRenderAlignment: number;
  missingObjects: string[];
  extraObjects: string[];
  suspiciousDifferences: string[];
  status: "near_match" | "needs_review" | "mismatch";
};

export type DiagramEdit = {
  id: string;
  at: string;
  source: "structured" | "natural_language" | "code" | "safe_fix";
  operation: string;
  objectId?: string;
  before?: unknown;
  after?: unknown;
};

export type TikzQualitySummary = {
  classification: number;
  objectCoverage: number;
  labelCoverage: number;
  relationships: number;
  compilation: number;
  layout: number;
  comparison: number;
  teacherConfirmationRequired: boolean;
  overall: "ready" | "warning" | "needs_review" | "unreliable";
};

export type TikzDiagramDraft = {
  id: string;
  ownerId?: string;
  source: {
    sourceType: "image" | "pdf_crop" | "recognized_document" | "description" | "existing_tikz" | "tikz_bank";
    sourceAssetId?: string;
    sourceName?: string;
    sourceHash: string;
    originalWidth?: number;
    originalHeight?: number;
    processedWidth?: number;
    processedHeight?: number;
    mimeType?: string;
    originalFileName?: string;
    cropBounds?: SourceBox;
    preprocessingSettings?: TikzPreprocessingSettings;
    sourceAsset?: PrivateTikzAssetRef;
    localDataUrl?: string;
    sourceAvailable?: boolean;
  };
  classification: {
    type: DiagramClass;
    subtype?: string;
    confidence: "high" | "medium" | "low";
    detectedFeatures: string[];
    warnings: string[];
    teacherConfirmed: boolean;
  };
  objects: DiagramObject[];
  relationships: DiagramRelationship[];
  layout: { bounds: DiagramBounds; scale: number; rotation?: number; coordinateSystem?: string };
  tikz: { snippet: string; generatedSnippet: string; standalone: string; libraries: string[]; packages: string[]; semanticSync: "synchronized" | "partially_detached" };
  compilation: TikzCompilationResult;
  validation: TikzValidationResult;
  comparison?: DiagramComparisonResult;
  quality: TikzQualitySummary;
  reviewQueue?: TikzReviewItem[];
  confirmedAsset?: ConfirmedDiagramAsset;
  documentReferences?: DiagramDocumentReference[];
  teacherEdits: DiagramEdit[];
  status: "draft" | "recognized" | "needs_review" | "valid" | "confirmed" | "exported";
  metadata: { createdAt: string; updatedAt: string; version: string };
};

export type StructuredEditOperation =
  | { type: "move_object"; objectId: string; position: DiagramPoint }
  | { type: "rename_point"; objectId: string; label: string }
  | { type: "change_line_style"; objectId: string; style: "solid" | "dashed" | "dotted" }
  | { type: "move_label"; objectId: string; anchor: DiagramObject["anchor"] }
  | { type: "add_right_angle"; pointId: string; segmentIds?: string[] }
  | { type: "add_point"; label: string; position: DiagramPoint }
  | { type: "add_relationship"; relationship: DiagramRelationship };
