import { localProvider } from "@/lib/ai/providers/local-provider";

export const AI_DEMO_WARNING =
  "Nội dung là bản nháp hỗ trợ giáo viên. Giáo viên cần kiểm tra, chỉnh sửa trước khi sử dụng chính thức.";

// Giữ export cũ để các import nội bộ trước đây không bị vỡ.
export const mockProvider = localProvider;
