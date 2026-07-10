-- Limit the shared Soạn Lab question bank to Physics/Chemistry multiple-choice reference questions.
-- This migration only touches system/app-provided rows and never deletes teacher personal rows.

delete from public.question_bank
where bank_scope = 'system'
  and (
    subject not in ('Vật lí', 'Hóa học')
    or question_type <> 'Trắc nghiệm'
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
      'needsReview', true,
      'note', 'Câu hỏi tham khảo theo định hướng Kết nối tri thức, không phải câu hỏi chính thức từ sách giáo khoa.'
    )
where bank_scope = 'system';
