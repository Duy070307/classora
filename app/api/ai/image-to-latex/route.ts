import { NextResponse } from "next/server";
import { generateLatexFromImage, type ImageToLatexMode } from "@/lib/ai/image-to-latex";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";

const allowedMimeTypes = new Set(["image/png", "image/jpeg", "image/webp"]);
const allowedModes = new Set<ImageToLatexMode>(["auto", "formula", "geometry"]);
const maxSize = 5 * 1024 * 1024;

async function requireUserIfConfigured() {
  if (!isSupabaseConfigured()) return true;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return true;
  const { data } = await supabase.auth.getUser();
  return Boolean(data.user);
}

export async function POST(request: Request) {
  try {
    const authenticated = await requireUserIfConfigured();
    if (!authenticated) {
      return NextResponse.json(
        { ok: false, error: "Vui lòng đăng nhập để dùng công cụ Ảnh công thức → LaTeX." },
        { status: 401 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("image");
    const modeValue = formData.get("mode");
    const mode = typeof modeValue === "string" && allowedModes.has(modeValue as ImageToLatexMode)
      ? modeValue as ImageToLatexMode
      : "auto";

    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "Vui lòng chọn một ảnh công thức để nhận diện." }, { status: 400 });
    }

    if (!allowedMimeTypes.has(file.type)) {
      return NextResponse.json({ ok: false, error: "Soạn Lab chỉ hỗ trợ ảnh PNG, JPG/JPEG hoặc WEBP." }, { status: 400 });
    }

    if (file.size > maxSize) {
      return NextResponse.json({ ok: false, error: "Ảnh quá lớn. Vui lòng dùng ảnh tối đa 5MB." }, { status: 400 });
    }

    if ((process.env.AI_PROVIDER || "local").toLowerCase() !== "gemini") {
      return NextResponse.json(
        {
          ok: false,
          error: "Công cụ nhận diện ảnh chưa sẵn sàng trong môi trường hiện tại. Vui lòng thử lại sau.",
        },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await generateLatexFromImage({
      imageBase64: buffer.toString("base64"),
      mimeType: file.type,
      mode,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error
          ? error.message
          : "Soạn Lab chưa nhận diện được ảnh này. Vui lòng thử ảnh đã cắt gọn và rõ nét hơn.",
      },
      { status: 400 },
    );
  }
}
