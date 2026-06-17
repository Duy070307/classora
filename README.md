# Classora

Classora là MVP web app dành cho giáo viên Việt Nam, giúp tạo nhanh bản nháp đề kiểm tra, phiếu học tập, nhận xét học sinh và xuất tài liệu ra Word.

Slogan: “Soạn đề, tạo tài liệu, xuất Word trong vài phút.”

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- React
- `docx` để xuất file `.docx`
- `localStorage` cho lịch sử tài liệu và số lượt sử dụng
- Mock AI, không cần API key

## Install

```bash
npm install
```

## Run Locally

```bash
npm run dev
```

Mở trình duyệt tại:

```text
http://localhost:3000
```

## Build

```bash
npm run build
```

## Main Routes

- `/`
- `/dashboard`
- `/history`
- `/tools/exam-generator`
- `/tools/worksheet-generator`
- `/tools/student-comments`
- `/tools/lesson-plan-generator`
- `/tools/matrix-generator`
- `/tools/answer-key-generator`
- `/tools/rubric-generator`
- `/tools/parent-message-generator`
- `/tools/question-bank-generator`
- `/tools/question-variant-generator`
- `/tools/exam-checker`
- `/tools/activity-generator`
- `/tools/differentiated-exercises`
- `/tools/exam-shuffler`
- `/tools/slide-outline-generator`
- `/tools/lesson-summary`
- `/tools/mindmap-outline`
- `/tools/homeroom-plan`
- `/tools/parent-meeting-minutes`
- `/tools/latex-converter`
- `/tools/latex-preview`
- `/templates`

## Current Limitations

- Chưa có AI thật, đang dùng AI mô phỏng.
- Chưa có đăng nhập.
- Chưa có database.
- Chưa có thanh toán.
- Chưa có OCR, upload ảnh hoặc upload PDF.
- Lịch sử chỉ lưu trong `localStorage` của trình duyệt hiện tại.
- Nội dung do AI mô phỏng tạo ra cần được giáo viên kiểm tra trước khi sử dụng.

## Future Roadmap

- Real AI integration
- Login/database
- Upload PDF/image
- Trộn mã đề
- Payment
