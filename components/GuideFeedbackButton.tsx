"use client";

import { MessageCircle } from "lucide-react";

export function GuideFeedbackButton() {
  return (
    <button
      type="button"
      className="btn-primary"
      onClick={() => window.dispatchEvent(new CustomEvent("soanlab:open-feedback"))}
    >
      <MessageCircle size={16} />
      Gửi góp ý
    </button>
  );
}
