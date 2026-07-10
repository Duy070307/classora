export const betaRequestStatuses = ["pending", "approved", "rejected"] as const;

export type BetaRequestStatus = (typeof betaRequestStatuses)[number];

export type BetaRequestInput = {
  fullName: string;
  email: string;
  phone: string;
  subject: string;
  teachingLevel: string;
  school: string;
  purpose: string;
  note: string;
};

const limits = {
  fullName: 120,
  email: 254,
  phone: 40,
  subject: 120,
  teachingLevel: 120,
  school: 180,
  purpose: 1200,
  note: 1200,
} as const;

function clean(value: unknown) {
  return typeof value === "string" ? value.trim().replace(/\r\n?/g, "\n") : "";
}

export function validateBetaRequest(value: unknown):
  | { ok: true; data: BetaRequestInput }
  | { ok: false; error: string } {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ok: false, error: "Thông tin đăng ký chưa hợp lệ." };
  }

  const source = value as Record<string, unknown>;
  const data: BetaRequestInput = {
    fullName: clean(source.fullName),
    email: clean(source.email).toLowerCase(),
    phone: clean(source.phone),
    subject: clean(source.subject),
    teachingLevel: clean(source.teachingLevel),
    school: clean(source.school),
    purpose: clean(source.purpose),
    note: clean(source.note),
  };

  if (!data.fullName) return { ok: false, error: "Vui lòng nhập họ và tên." };
  if (!data.email) return { ok: false, error: "Vui lòng nhập email." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    return { ok: false, error: "Email chưa đúng định dạng." };
  }
  if (!data.subject) return { ok: false, error: "Vui lòng nhập môn đang dạy." };
  if (!data.teachingLevel) return { ok: false, error: "Vui lòng nhập cấp hoặc lớp đang dạy." };
  if (!data.purpose) return { ok: false, error: "Vui lòng cho biết thầy/cô muốn dùng SOẠN LAB cho việc gì." };

  for (const [key, max] of Object.entries(limits) as Array<[keyof BetaRequestInput, number]>) {
    if (data[key].length > max) {
      return { ok: false, error: `Trường thông tin “${fieldLabels[key]}” không được dài quá ${max} ký tự.` };
    }
  }

  return { ok: true, data };
}

const fieldLabels: Record<keyof BetaRequestInput, string> = {
  fullName: "Họ và tên",
  email: "Email",
  phone: "Số điện thoại/Zalo",
  subject: "Môn dạy",
  teachingLevel: "Cấp/lớp đang dạy",
  school: "Trường/đơn vị",
  purpose: "Mục đích sử dụng",
  note: "Ghi chú",
};

export function isBetaRequestStatus(value: unknown): value is BetaRequestStatus {
  return typeof value === "string" && betaRequestStatuses.includes(value as BetaRequestStatus);
}
