import { NextResponse } from "next/server";
import { generateWithAI } from "@/lib/ai";
import type { AIRefinementAction } from "@/lib/ai";

const actions = new Set<AIRefinementAction>([
  "regenerate", "shorter", "more-detailed", "simpler", "more-formal", "easier", "harder"
]);

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      tool?: unknown;
      input?: unknown;
      currentContent?: unknown;
      action?: unknown;
    };

    if (typeof body.tool !== "string" || !body.tool.trim()) {
      return NextResponse.json({ error: "Thiếu tool hợp lệ." }, { status: 400 });
    }
    if (body.action !== undefined && (typeof body.action !== "string" || !actions.has(body.action as AIRefinementAction))) {
      return NextResponse.json({ error: "Action không được hỗ trợ." }, { status: 400 });
    }

    const result = await generateWithAI(
      body.tool,
      body.input ?? {},
      typeof body.currentContent === "string" ? body.currentContent : undefined,
      body.action as AIRefinementAction | undefined
    );
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không thể tạo nội dung mô phỏng.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
