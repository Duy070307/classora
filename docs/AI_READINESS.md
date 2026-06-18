# AI Readiness

Soạn Lab hiện chỉ dùng AI mô phỏng và chạy không cần API key.

## Kiến trúc

- Types chung: `lib/ai/types.ts`
- Prompt builders tiếng Việt: `lib/ai/prompts.ts`
- Mock provider: `lib/ai/mock-provider.ts`
- Provider selector: `lib/ai/index.ts`

Mọi tích hợp AI thật trong tương lai nên đi qua provider layer. Chế độ mặc định phải luôn là `mock` để bản demo local không bị phụ thuộc mạng hoặc dịch vụ trả phí.

## Biến môi trường tương lai

```env
AI_PROVIDER=mock
OPENAI_API_KEY=
GOOGLE_AI_API_KEY=
```

Các biến này hiện chưa được ứng dụng sử dụng.

## Nguyên tắc an toàn

- Không bao giờ để API key trong client bundle hoặc localStorage.
- Lời gọi AI thật phải chạy server-side.
- Không tự động bật provider thật chỉ vì tìm thấy API key.
- Theo dõi usage và giới hạn chi phí trước khi mở public.
- Prompt phải nhắc mô hình không bịa quy định chính thức và yêu cầu giáo viên xác minh output.
- Provider lỗi phải có fallback hoặc thông báo rõ, không làm hỏng demo mock.
