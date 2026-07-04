const STORAGE_KEY = "soanlab_ai_daily_usage";
const DEFAULT_LIMIT = 30;

type UsageState = {
  date: string;
  count: number;
};

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function getAIDailyLimit() {
  return DEFAULT_LIMIT;
}

export function getAIUsageState(): UsageState {
  if (typeof window === "undefined") return { date: todayKey(), count: 0 };
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}") as Partial<UsageState>;
    if (parsed.date === todayKey() && typeof parsed.count === "number") {
      return { date: parsed.date, count: parsed.count };
    }
  } catch {
    // ignore malformed local storage
  }
  return { date: todayKey(), count: 0 };
}

export function canUseAIGeneration() {
  return getAIUsageState().count < getAIDailyLimit();
}

export function incrementAIUsage() {
  if (typeof window === "undefined") return;
  const state = getAIUsageState();
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: todayKey(), count: state.count + 1 }));
}

export function getAILimitMessage() {
  return "Bạn đã dùng hết lượt tạo nội dung hôm nay trên trình duyệt này. Có thể thử lại sau hoặc dùng nội dung đã lưu trong lịch sử.";
}
