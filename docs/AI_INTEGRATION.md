# AI integration

Soạn Lab hỗ trợ tạo nội dung qua server-side AI provider. Chế độ mặc định là `local`, không cần API key và vẫn dùng được khi build/deploy.

## Providers

- `local`: tạo nội dung bằng logic cục bộ hiện có, dùng làm fallback an toàn.
- `openai`: gọi OpenAI từ server route.
- `gemini`: gọi Gemini từ server route.
- `grok`: gọi endpoint OpenAI-compatible từ server route; hỗ trợ text và vision khi model/gói API cho phép.

Không gọi provider AI trực tiếp từ frontend và không hiển thị API key trong UI.

## Environment variables

Tạo `.env.local` khi chạy local nếu muốn dùng provider thật:

```env
AI_PROVIDER=local
AI_TEXT_PROVIDER=local
AI_VISION_PROVIDER=local

OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1-mini

GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash

GROK_API_KEY=
GROK_BASE_URL=https://api.x.ai/v1
GROK_MODEL=grok-4.3

AI_DAILY_LIMIT=30
AI_MAX_OUTPUT_TOKENS=4000
```

Nếu `AI_PROVIDER=openai` nhưng thiếu `OPENAI_API_KEY`, Soạn Lab tự fallback về `local`. Gemini cũng tương tự.

## Vercel setup

Trong Vercel Project Settings → Environment Variables, có thể thêm:

- `AI_PROVIDER`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `AI_TEXT_PROVIDER`
- `AI_VISION_PROVIDER`
- `GROK_API_KEY`
- `GROK_BASE_URL`
- `GROK_MODEL`
- `AI_DAILY_LIMIT`
- `AI_MAX_OUTPUT_TOKENS`

Redeploy sau khi đổi biến môi trường. Nếu chưa cấu hình provider thật, giữ `AI_PROVIDER=local`.

## Supported tools v1

- Tạo đề kiểm tra.
- Phiếu học tập.
- Kế hoạch bài dạy.
- Nhận xét học sinh.
- Nhận xét học sinh hàng loạt.
- Rubric.
- Tin nhắn phụ huynh.

Các tool khác vẫn dùng logic cục bộ hiện có.

Ảnh công thức → LaTeX và Hình học → TikZ chọn adapter qua `AI_VISION_PROVIDER`. Khi đặt `grok`, server gửi ảnh dạng data URL trong message multimodal OpenAI-compatible. Không tự chuyển sang Gemini nếu endpoint Grok không hỗ trợ ảnh; hệ thống trả lỗi capability được kiểm soát.

## Fallback behavior

`app/api/ai/generate` chọn text provider theo `AI_TEXT_PROVIDER` rồi `AI_PROVIDER`. Metadata provider/fallback không được trả ra response công khai. Vision dùng provider riêng và không fallback chéo sang Gemini.

## Cost and limits

Provider thật có thể phát sinh chi phí theo tài khoản API. Soạn Lab có bộ đếm lượt tạo nội dung theo `localStorage` để tránh bấm nhầm quá nhiều trong quá trình thử nghiệm. Đây không phải giới hạn bảo mật hoặc billing.

## Limitations

- Không có hard rate limit server-side vì chưa có database/auth.
- Nội dung là bản nháp và cần giáo viên rà soát.
- Structured exam JSON từ provider thật được parse nhẹ; nếu không hợp lệ, hệ thống dùng content text và formatter dự phòng.
