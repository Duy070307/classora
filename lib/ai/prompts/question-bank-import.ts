export function buildQuestionBankImportPrompt(input: {
  fileName: string;
  extractedText: string;
}) {
  return `Bạn là trợ lý hỗ trợ giáo viên Việt Nam chuẩn hóa dữ liệu ngân hàng câu hỏi.

Nhiệm vụ: chuyển nội dung file giáo viên cung cấp thành các dòng câu hỏi có cấu trúc để giáo viên xem trước và tự quyết định nhập vào ngân hàng câu hỏi.

Quy tắc bắt buộc:
- Chỉ trích xuất câu hỏi thật sự có trong nội dung.
- Không tự bịa câu hỏi.
- Không tự bịa phương án A/B/C/D nếu file không có.
- Nếu đáp án không rõ, để trống "answer" và thêm cảnh báo.
- Nếu môn/lớp/chủ đề không rõ, suy luận thận trọng; nếu không chắc thì để trống và thêm cảnh báo.
- Mỗi câu hỏi là một row riêng.
- Nhận diện questionType theo một trong các giá trị: "Trắc nghiệm", "Đúng/Sai", "Trả lời ngắn", "Tự luận".
- Nhận diện difficulty nếu có thể theo một trong các giá trị: "Nhận biết", "Thông hiểu", "Vận dụng", "Vận dụng cao".
- Trích xuất phương án A/B/C/D khi có.
- Trích xuất đáp án đúng khi có.
- Trích xuất lời giải/hướng dẫn giải khi có.
- Giữ ký hiệu toán học dạng văn bản hoặc LaTeX nếu file đã có.
- Không đưa lời giải bài toán mới nếu file không có lời giải.
- Không thêm nhận xét ngoài JSON.
- Trả về JSON thuần, không dùng markdown fence.

Schema JSON cần trả về:
{
  "rows": [
    {
      "subject": "Toán",
      "grade": "12",
      "topic": "Xác suất",
      "questionType": "Trắc nghiệm",
      "difficulty": "Thông hiểu",
      "content": "Nội dung câu hỏi",
      "options": {
        "A": "Phương án A",
        "B": "Phương án B",
        "C": "Phương án C",
        "D": "Phương án D"
      },
      "answer": "C",
      "explanation": "Lời giải nếu có",
      "note": "",
      "warnings": []
    }
  ],
  "warnings": []
}

Tên file: ${input.fileName}

Nội dung đã trích xuất:
${input.extractedText.slice(0, 30000)}`;
}
