export const DEFAULT_MAINTENANCE_MESSAGE = "SOẠN LAB đang bảo trì để nâng cấp hệ thống. Tài khoản dùng thử tạm thời chưa thể sử dụng. Thầy cô vui lòng quay lại sau.";

export type MaintenanceSettings = {
  enabled: boolean;
  message: string;
  updatedAt?: string;
  updatedBy?: string;
};

export function sanitizeMaintenanceMessage(value: unknown) {
  if (typeof value !== "string") return "";
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").replace(/<[^>]*>/g, "").trim();
}

export function validateMaintenanceUpdate(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { ok: false as const, error: "Dữ liệu cập nhật không hợp lệ." };
  const body = value as Record<string, unknown>;
  if (typeof body.enabled !== "boolean") return { ok: false as const, error: "Trạng thái bảo trì không hợp lệ." };
  const message = sanitizeMaintenanceMessage(body.message);
  if (body.enabled && !message) return { ok: false as const, error: "Vui lòng nhập thông báo bảo trì." };
  if (message.length > 600) return { ok: false as const, error: "Thông báo bảo trì không được vượt quá 600 ký tự." };
  return { ok: true as const, enabled: body.enabled, message: message || DEFAULT_MAINTENANCE_MESSAGE };
}
