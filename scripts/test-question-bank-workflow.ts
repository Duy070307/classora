import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import JSZip from "jszip";
import {
  auditAndUpdate,
  clusterDuplicateMatches,
  detectDuplicates,
  duplicateDecisionKey,
  filterIgnoredDuplicateMatches,
} from "../lib/question-bank-core/audit";
import { createQuestionCollection } from "../lib/question-bank-core/collections";
import { questionCollectionText } from "../lib/question-bank-core/export";
import {
  importRowsFromDelimited,
  importRowsFromTable,
  importRowsFromText,
} from "../lib/question-bank-core/import";
import { questionBankToExam } from "../lib/question-bank-core/integration";
import {
  createCanonicalQuestion,
  fromLegacyQuestion,
  toLegacyQuestion,
} from "../lib/question-bank-core/normalize";
import { buildSmartSet } from "../lib/question-bank-core/query";
import {
  activeQuestionFilters,
  clearQuestionFilter,
  reconcileQuestionSelection,
} from "../lib/question-bank-core/ui-state";
import {
  addQuestionsToCollection,
  bulkPatchOwnedQuestions,
  canMutateQuestion,
  gradingRules,
  lessonPlanQuestionLink,
  markExplanationVerified,
  markQuestionUsed,
  questionToWorksheetActivity,
  selectBlueprintAllocation,
} from "../lib/question-bank-core/workflow";
import { parseExamSourceBuffer } from "../lib/exam-source/file-parser";
import { maintenanceAccessDecision } from "../lib/maintenance-access";
import type { QuestionBankItem } from "../lib/question-bank-core/types";
import type { QuestionItem } from "../lib/types";

let passed = 0;
async function check(name: string, run: () => void | Promise<void>) {
  await run();
  passed += 1;
  console.log(`✓ ${name}`);
}
function q(patch: Partial<QuestionBankItem> = {}) {
  return createCanonicalQuestion({
    subject: "Toán",
    grade: "12",
    topic: "Hàm số",
    prompt: "Giá trị của hàm số tại x = 1 là bao nhiêu?",
    type: "multiple_choice",
    difficulty: "Nhận biết",
    options: ["A", "B", "C", "D"].map((label, index) => ({
      id: label,
      label,
      text: String(index + 1),
    })),
    correctOptionIds: ["A"],
    answer: "",
    score: 0.25,
    quality: {
      status: "valid",
      reviewStatus: "teacher_confirmed",
      issues: [],
      ignoredIssueCodes: [],
    },
    ...patch,
  });
}

async function main() {
  await check("1. Existing questions remain readable", () => {
    const old: QuestionItem = {
      id: "old",
      subject: "Toán",
      grade: "8",
      topic: "Đại số",
      question: "2+2=?",
      type: "Trắc nghiệm",
      difficulty: "Nhận biết",
      answer: "B",
      explanation: "",
      createdAt: "2026-01-01",
      options: { A: "3", B: "4", C: "5", D: "6" },
    };
    assert.equal(fromLegacyQuestion(old).prompt, "2+2=?");
  });
  await check("2. Existing MCQ records normalize safely", () =>
    assert.equal(
      toLegacyQuestion(
        fromLegacyQuestion({ ...toLegacyQuestion(q()), metadata: {} }),
      ).type,
      "Trắc nghiệm",
    ),
  );
  await check("3. MCQ validates correct option mapping", () =>
    assert.equal(auditAndUpdate(q()).quality.status, "valid"),
  );
  await check("4. True/false stable statement IDs work", () => {
    const item = auditAndUpdate(
      q({
        type: "true_false",
        options: [],
        correctOptionIds: [],
        trueFalseStatements: [
          { id: "s1", label: "a", text: "Mệnh đề", answer: true },
        ],
      }),
    );
    assert.notEqual(item.quality.status, "invalid");
  });
  await check("5. Numeric accepted alternatives work", () => {
    const item = auditAndUpdate(
      q({
        type: "short_answer",
        options: [],
        correctOptionIds: [],
        answer: "2",
        acceptedAnswers: ["2,0", "2.0"],
      }),
    );
    assert.equal(item.acceptedAnswers.length, 2);
  });
  await check("6. Essay rubric data is preserved", () => {
    const item = toLegacyQuestion(
      q({
        type: "essay",
        options: [],
        correctOptionIds: [],
        answer: "",
        essayRubric: [
          { id: "r", criterion: "Lập luận", maxScore: 1, guidance: "Đúng" },
        ],
      }),
    );
    assert.equal(fromLegacyQuestion(item).essayRubric[0].criterion, "Lập luận");
  });
  await check("7. XLSX MCQ template import works", async () => {
    const parsed = await parseExamSourceBuffer({
      name: "mcq.xlsx",
      buffer: await readFile(
        "public/templates/mau-ngan-hang-cau-hoi-trac-nghiem.xlsx",
      ),
    });
    assert.equal(
      parsed.tables.flatMap((table) => importRowsFromTable(table.rows)).length,
      1,
    );
  });
  await check("8. XLSX true/false template import works", async () => {
    const parsed = await parseExamSourceBuffer({
      name: "tf.xlsx",
      buffer: await readFile(
        "public/templates/mau-ngan-hang-cau-hoi-dung-sai.xlsx",
      ),
    });
    const rows = parsed.tables.flatMap((table) =>
      importRowsFromTable(table.rows),
    );
    assert.equal(rows[0].item.trueFalseStatements[0].answer, true);
  });
  await check("9. Semicolon CSV import works", () =>
    assert.equal(
      importRowsFromDelimited(
        "Môn;Lớp;Chủ đề;Dạng câu;Câu hỏi;A;B;C;D;Đáp án\nToán;12;Hàm số;Trắc nghiệm;Câu hỏi;1;2;3;4;A",
      ).length,
      1,
    ),
  );
  await check("10. DOCX question parsing works", async () => {
    const zip = new JSZip();
    zip.file(
      "word/document.xml",
      '<w:document xmlns:w="x"><w:body><w:p><w:r><w:t>Câu 1. 2+2=?</w:t></w:r></w:p><w:p><w:r><w:t>A. 3</w:t></w:r></w:p><w:p><w:r><w:t>B. 4</w:t></w:r></w:p></w:body></w:document>',
    );
    const buffer = Buffer.from(await zip.generateAsync({ type: "uint8array" }));
    const parsed = await parseExamSourceBuffer({ name: "test.docx", buffer });
    assert.match(parsed.text, /2\+2/);
  });
  await check("11. Text-layer PDF import works", async () => {
    const buffer = await readFile(
      "node_modules/pdf-parse/test/data/01-valid.pdf",
    );
    const parsed = await parseExamSourceBuffer({ name: "text.pdf", buffer });
    assert.ok(parsed.text.length > 1000);
  });
  await check("12. Scanned PDF routes to Document Recognition", async () => {
    const buffer = await readFile(
      "node_modules/pdf-parse/test/data/05-versions-space.pdf",
    );
    const parsed = await parseExamSourceBuffer({ name: "scan.pdf", buffer });
    assert.match(parsed.warnings.join(" "), /bản quét hình ảnh/);
  });
  await check("13. Import review blocks invalid questions", () =>
    assert.equal(importRowsFromText("Câu 1. X?")[0].selected, false),
  );
  await check("14. Bulk metadata edit respects ownership", () => {
    const changed = bulkPatchOwnedQuestions(
      [q({ id: "a", ownerId: "u" }), q({ id: "b", ownerId: "v" })],
      ["a", "b"],
      { topic: "Mới" },
      "u",
    );
    assert.deepEqual(
      changed.map((item) => item.topic),
      ["Mới", "Hàm số"],
    );
  });
  await check("15. Exact duplicates are detected", () =>
    assert.equal(
      detectDuplicates([q({ id: "a" }), q({ id: "b" })])[0].kind,
      "exact",
    ),
  );
  await check("16. Reordered-option duplicates are detected", () => {
    const a = q({ id: "a" });
    const b = q({ id: "b", options: [...a.options].reverse() });
    assert.equal(detectDuplicates([a, b])[0].kind, "reordered_options");
  });
  await check("17. Near duplicates produce warnings", () => {
    const matches = detectDuplicates([
      q({ id: "a", prompt: "Tính giá trị của hàm số y tại x bằng một" }),
      q({ id: "b", prompt: "Hãy tính giá trị hàm số y khi x bằng một" }),
    ]);
    assert.ok(matches.some((item) => item.kind === "near"));
  });
  await check("18. Duplicate decisions do not auto-delete", () => {
    const source = [q({ id: "a" }), q({ id: "b" })];
    detectDuplicates(source);
    assert.equal(source.length, 2);
  });
  await check("19. Collection references questions", () =>
    assert.deepEqual(createQuestionCollection("Ôn tập", ["a"]).questionIds, [
      "a",
    ]),
  );
  await check("20. One question belongs to multiple collections", () => {
    const a = createQuestionCollection("A", ["q"]);
    const b = createQuestionCollection("B", ["q"]);
    assert.equal(a.questionIds[0], b.questionIds[0]);
  });
  await check("21. Smart set respects count", () =>
    assert.equal(
      buildSmartSet([q({ id: "1" }), q({ id: "2" }), q({ id: "3" })], {
        topics: [],
        types: [],
        count: 2,
        seed: "x",
      }).selected.length,
      2,
    ),
  );
  await check("22. Same seed produces same set", () => {
    const items = [q({ id: "1" }), q({ id: "2" }), q({ id: "3" })];
    const config = { topics: [], types: [], count: 2, seed: "same" };
    assert.deepEqual(
      buildSmartSet(items, config).selected.map((item) => item.id),
      buildSmartSet(items, config).selected.map((item) => item.id),
    );
  });
  await check("23. Recently used exclusion works", () => {
    const result = buildSmartSet(
      [
        q({
          id: "used",
          usage: {
            count: 1,
            lastUsedAt: new Date().toISOString(),
            documentIds: [],
          },
        }),
        q({ id: "fresh" }),
      ],
      {
        topics: [],
        types: [],
        count: 2,
        seed: "x",
        excludeRecentlyUsedDays: 7,
      },
    );
    assert.deepEqual(
      result.selected.map((item) => item.id),
      ["fresh"],
    );
  });
  await check("24. Insufficient availability shows shortage", () =>
    assert.ok(
      buildSmartSet([q()], { topics: [], types: [], count: 3, seed: "x" })
        .shortages.length,
    ),
  );
  await check("25. Blueprint selection respects allocation", () => {
    const result = selectBlueprintAllocation([q()], {
      subject: "Toán",
      grade: "12",
      topic: "Hàm số",
      type: "multiple_choice",
      difficulty: "Nhận biết",
      count: 2,
    });
    assert.equal(result.shortage, 1);
  });
  await check("26. Exam receives compatible StructuredExam questions", () => {
    const item = q();
    assert.equal(
      questionBankToExam([item]).exam.parts[0].questions[0].id,
      item.id,
    );
  });
  await check("27. Worksheet receives compatible activities", () =>
    assert.equal(questionToWorksheetActivity(q()).type, "multiple_choice"),
  );
  await check("28. Lesson Plan links selected questions", () =>
    assert.equal(
      lessonPlanQuestionLink(q({ id: "linked" })).questionId,
      "linked",
    ),
  );
  await check("29. Answer Solutions updates verified status", () =>
    assert.equal(
      markExplanationVerified(q(), "Lời giải").quality.reviewStatus,
      "verified",
    ),
  );
  await check("30. Grading receives scoring rules", () => {
    const rules = gradingRules(q({ acceptedAnswers: ["1"], tolerance: 0.01 }));
    assert.equal(rules.tolerance, 0.01);
  });
  await check("31. Student export contains no answers", () =>
    assert.doesNotMatch(questionCollectionText([q()], "student"), /Đáp án:/),
  );
  await check("32. Teacher export contains explanations", () =>
    assert.match(
      questionCollectionText(
        [q({ explanation: "Giải thích đúng" })],
        "teacher",
      ),
      /Giải thích đúng/,
    ),
  );
  await check("33. Teacher cannot access another teacher's question", () =>
    assert.equal(canMutateQuestion(q({ ownerId: "other" }), "me"), false),
  );
  await check("34. Collection updates preserve references only", () => {
    const collection = addQuestionsToCollection(
      createQuestionCollection("A", ["1"]),
      ["2"],
    );
    assert.deepEqual(collection.questionIds, ["1", "2"]);
  });
  await check("35. Maintenance mode blocks teacher", () =>
    assert.equal(
      maintenanceAccessDecision({
        pathname: "/question-bank",
        enabled: true,
        authenticated: true,
        role: "teacher",
      }),
      "redirect",
    ),
  );
  await check("36. Admin bypass works", () =>
    assert.equal(
      maintenanceAccessDecision({
        pathname: "/question-bank",
        enabled: true,
        authenticated: true,
        role: "admin",
      }),
      "allow",
    ),
  );
  await check("37. Exam mapping preserves stable IDs", () =>
    assert.equal(
      questionBankToExam([q({ id: "stable" })]).exam.parts[0].questions[0].id,
      "stable",
    ),
  );
  await check("38. Blueprint shortage never relaxes topic", () =>
    assert.equal(
      selectBlueprintAllocation([q({ topic: "Khác" })], {
        subject: "Toán",
        grade: "12",
        topic: "Hàm số",
        type: "multiple_choice",
        difficulty: "Nhận biết",
        count: 1,
      }).selected.length,
      0,
    ),
  );
  await check("39. Worksheet preserves answer", () =>
    assert.equal(questionToWorksheetActivity(q()).answer, "A"),
  );
  await check("40. Lesson Plan preserves topic", () =>
    assert.equal(lessonPlanQuestionLink(q()).topic, "Hàm số"),
  );
  await check("41. Usage tracking preserves document IDs", () => {
    const item = markQuestionUsed(q(), "doc-1", "ready");
    assert.deepEqual(item.usage.documentIds, ["doc-1"]);
  });

  await check("42. Generic common wording is not a duplicate", () => {
    const matches = detectDuplicates([
      q({
        id: "generic-a",
        prompt: "Phát biểu nào sau đây đúng về đạo hàm của hàm số?",
      }),
      q({
        id: "generic-b",
        prompt: "Phát biểu nào sau đây đúng về tính đơn điệu của dãy số?",
      }),
    ]);
    assert.equal(matches.length, 0);
  });
  await check("43. Same topic alone is not a duplicate", () => {
    const matches = detectDuplicates([
      q({ id: "topic-a", prompt: "Tìm tập xác định của hàm số đã cho." }),
      q({ id: "topic-b", prompt: "Tính đạo hàm của hàm số đã cho." }),
    ]);
    assert.equal(matches.length, 0);
  });
  await check(
    "44. Same formula with a different task is not a duplicate",
    () => {
      const matches = detectDuplicates([
        q({
          id: "formula-a",
          prompt: "Tính giá trị của y = x^2 + 1 tại x = 2.",
        }),
        q({ id: "formula-b", prompt: "Chứng minh y = x^2 + 1 luôn dương." }),
      ]);
      assert.equal(matches.length, 0);
    },
  );
  await check("45. Duplicate questions are grouped into clusters", () => {
    const questions = [q({ id: "c1" }), q({ id: "c2" }), q({ id: "c3" })];
    const clusters = clusterDuplicateMatches(questions);
    assert.equal(clusters.length, 1);
    assert.equal(clusters[0].questionIds.length, 3);
  });
  await check("46. Eight related questions do not create 28 pair rows", () => {
    const questions = Array.from({ length: 8 }, (_, index) =>
      q({ id: `eight-${index}` }),
    );
    const clusters = clusterDuplicateMatches(questions);
    assert.equal(clusters.length, 1);
    assert.equal(clusters[0].questionIds.length, 8);
  });
  await check("47. Not-duplicate decision hides unchanged content", () => {
    const left = q({ id: "ignore-a" });
    const right = q({ id: "ignore-b" });
    const matches = detectDuplicates([left, right]);
    const key = duplicateDecisionKey(left, right);
    assert.equal(
      filterIgnoredDuplicateMatches(matches, [left, right], new Set([key]))
        .length,
      0,
    );
  });
  await check("48. Changed content can be reviewed again", () => {
    const left = q({ id: "changed-a" });
    const right = q({ id: "changed-b" });
    const oldKey = duplicateDecisionKey(left, right);
    const changed = q({
      id: "changed-b",
      prompt: `${right.prompt} Hãy chọn đáp án.`,
    });
    assert.notEqual(duplicateDecisionKey(left, changed), oldKey);
  });
  await check("49. Active filter chips contain only selected filters", () => {
    const chips = activeQuestionFilters({
      scope: "all",
      usage: "all",
      subject: "Toán",
      grade: "12",
    });
    assert.deepEqual(
      chips.map((chip) => chip.value),
      ["Toán", "12"],
    );
  });
  await check("50. One active filter can be cleared", () => {
    assert.equal(
      clearQuestionFilter(
        { scope: "user", usage: "used", subject: "Toán" },
        "subject",
      ).subject,
      undefined,
    );
  });
  await check("51. Selection only drops deleted records", () => {
    assert.deepEqual(
      reconcileQuestionSelection(["a", "b"], new Set(["b", "c"])),
      ["b"],
    );
  });

  const [
    sidebarSource,
    registrySource,
    dashboardSource,
    createSource,
    sitemapSource,
    workspaceSource,
    historySource,
    studentRoute,
    bulkRoute,
    parentRoute,
    questionBankPage,
    toolsPage,
    presetsSource,
    samplePrefillSource,
    draftsPage,
  ] = await Promise.all([
    readFile("components/Sidebar.tsx", "utf8"),
    readFile("lib/tool-registry.ts", "utf8"),
    readFile("app/dashboard/page.tsx", "utf8"),
    readFile("app/create/page.tsx", "utf8"),
    readFile("app/sitemap.ts", "utf8"),
    readFile("components/question-bank/QuestionBankWorkspace.tsx", "utf8"),
    readFile("lib/history.ts", "utf8"),
    readFile("app/tools/student-comments/page.tsx", "utf8"),
    readFile("app/tools/bulk-student-comments/page.tsx", "utf8"),
    readFile("app/tools/parent-message-generator/page.tsx", "utf8"),
    readFile("app/question-bank/page.tsx", "utf8"),
    readFile("app/tools/page.tsx", "utf8"),
    readFile("lib/presets.ts", "utf8"),
    readFile("lib/sample-prefill.ts", "utf8"),
    readFile("app/drafts/page.tsx", "utf8"),
  ]);
  await check("52. Student Comment is absent from Sidebar", () =>
    assert.doesNotMatch(sidebarSource, /student-comments/),
  );
  await check("53. Removed tools are absent from Tool Center registry", () => {
    assert.doesNotMatch(
      registrySource,
      /student-comments|parent-message-generator/,
    );
  });
  await check(
    "54. Removed tools are absent from Dashboard and Create Center",
    () => {
      assert.doesNotMatch(
        `${dashboardSource}\n${createSource}`,
        /student-comments|parent-message-generator/,
      );
    },
  );
  await check("55. Parent Message is absent from Sidebar", () =>
    assert.doesNotMatch(sidebarSource, /parent-message-generator/),
  );
  await check("56. Legacy routes redirect safely", () => {
    for (const source of [studentRoute, bulkRoute, parentRoute]) {
      assert.match(source, /requireUser/);
      assert.match(source, /getMaintenanceBlockForUser/);
      assert.match(source, /redirect\("\/tools"\)/);
    }
  });
  await check("57. Legacy history types remain readable", () => {
    assert.match(historySource, /student-comment/);
    assert.match(historySource, /bulk-student-comments/);
    assert.match(historySource, /parent-message/);
    assert.match(historySource, /isLegacyToolDocument/);
  });
  await check("58. Question Bank has one export action area", () => {
    assert.equal((workspaceSource.match(/label="Xuất"/g) || []).length, 1);
    assert.doesNotMatch(workspaceSource, /DocumentExportMenu/);
  });
  await check("59. Bulk toolbar and editor are conditional", () => {
    assert.match(workspaceSource, /selectedItems\.length \?/);
    assert.match(workspaceSource, /editorOpen \?/);
    assert.match(workspaceSource, /useState\(false\)/);
  });
  await check("60. Unsaved editor changes require confirmation", () => {
    assert.match(workspaceSource, /Nội dung chưa lưu/);
    assert.match(workspaceSource, /window\.confirm/);
  });
  await check(
    "61. Clear filters is conditional and chips are removable",
    () => {
      assert.match(workspaceSource, /activeFilters\.length \?/);
      assert.match(workspaceSource, /clearQuestionFilter/);
    },
  );
  await check("62. Mobile filter and editor layouts are present", () => {
    assert.match(workspaceSource, /lg:hidden/);
    assert.match(workspaceSource, /h-dvh w-full/);
    assert.match(workspaceSource, /min-w-0/);
  });
  await check("63. Markdown and TXT are inside the export menu", () => {
    assert.equal((workspaceSource.match(/label: "Markdown"/g) || []).length, 1);
    assert.equal((workspaceSource.match(/label: "TXT"/g) || []).length, 1);
  });
  await check("64. Removed tools are absent from sitemap", () => {
    assert.doesNotMatch(sitemapSource, /student-comments|parent-message/);
  });
  await check("65. Question Bank page enforces auth and maintenance", () => {
    assert.match(questionBankPage, /requireUser/);
    assert.match(questionBankPage, /getMaintenanceBlockForUser/);
  });
  await check("66. Question cards do not expose stable IDs or hashes", () => {
    assert.doesNotMatch(workspaceSource, /Mã ổn định/);
    assert.doesNotMatch(workspaceSource, /content hash/i);
  });
  await check("67. Tool search does not suggest removed tools", () => {
    assert.doesNotMatch(
      toolsPage,
      /placeholder="[^"]*(phụ huynh|nhận xét)/i,
    );
  });
  await check("68. Removed tools have no active quick presets", () => {
    assert.doesNotMatch(
      presetsSource,
      /studentCommentPresets|parent-message-generator/,
    );
  });
  await check("69. Removed tools have no sample-prefill entry", () => {
    assert.doesNotMatch(
      samplePrefillSource,
      /student-comment|parent-message-generator/,
    );
  });
  await check("70. Legacy drafts cannot reopen removed tools", () => {
    assert.match(draftsPage, /legacyDraftToolKeys/);
    assert.match(draftsPage, /!isLegacy/);
    assert.match(draftsPage, /Nội dung cũ/);
  });

  assert.equal(passed, 70);
  console.log(`Question Bank workflow: ${passed}/70 kiểm tra đạt.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
