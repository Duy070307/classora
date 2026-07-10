-- Clean invalid Soạn Lab system multiple-choice rows.
-- The schema stores answer choices in public.question_bank.options as jsonb with keys A/B/C/D.
-- This only touches bank_scope = 'system' and never deletes teacher personal rows.

delete from public.question_bank
where bank_scope = 'system'
  and (
    subject not in ('Vật lí', 'Hóa học')
    or question_type <> 'Trắc nghiệm'
    or options is null
    or jsonb_typeof(options) <> 'object'
    or nullif(trim(options->>'A'), '') is null
    or nullif(trim(options->>'B'), '') is null
    or nullif(trim(options->>'C'), '') is null
    or nullif(trim(options->>'D'), '') is null
    or upper(trim(coalesce(answer, ''))) not in ('A', 'B', 'C', 'D')
    or content ~* '(kiểm tra kiến thức nền|yêu cầu nào phù hợp|phương án nào phù hợp nhất)'
    or explanation ~* '(cần kiểm tra bản chất|Phương án A phù hợp)'
  );

update public.question_bank
set
  user_id = null,
  book_series = 'Kết nối tri thức',
  source_type = 'Soạn Lab seed',
  content_type = 'Lý thuyết',
  needs_review = true,
  metadata = coalesce(metadata, '{}'::jsonb)
    || jsonb_build_object(
      'bookSeries', 'Kết nối tri thức',
      'sourceType', 'Soạn Lab seed',
      'contentType', 'Lý thuyết',
      'generatedBy', 'Soạn Lab seed',
      'needsReview', true
    )
where bank_scope = 'system';
