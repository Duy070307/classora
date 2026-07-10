import { NextRequest, NextResponse } from "next/server";
import { extractJson } from "@/lib/ai/extract-json";
import { getConfiguredProvider } from "@/lib/ai/provider";
import { buildThreeDAnimationPrompt } from "@/lib/ai/prompts/three-d-animation";
import { detectGeometryShapeIntent } from "@/lib/geometry/shape-intent";
import { buildGeometryTemplate, hasGeometryTemplateMismatch } from "@/lib/geometry/three-templates";

type AnimationResult = {
  title: string;
  description: string;
  html: string;
  notes: string[];
  warnings: string[];
};

const allowedScriptSrc = [
  "https://unpkg.com/three@0.160.0/build/three.min.js",
  "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js",
  "https://unpkg.com/three@0.160.0/examples/js/controls/OrbitControls.js",
  "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/js/controls/OrbitControls.js",
];

const blockedPatterns = [
  /fetch\s*\(/i,
  /XMLHttpRequest/i,
  /localStorage/i,
  /sessionStorage/i,
  /document\.cookie/i,
  /window\.top/i,
  /window\.parent/i,
  /\bparent\./i,
  /\btop\./i,
  /eval\s*\(/i,
  /Function\s*\(/i,
  /navigator\.sendBeacon/i,
  /location\.(assign|replace|href)/i,
  /window\.location/i,
  /<\s*(iframe|embed|object|form)\b/i,
  /<\s*script[^>]+type=["']module["']/i,
  /\bimport\s+.*from\s+["']https?:\/\//i,
  /height\s*:\s*200px/i,
  /<canvas[^>]+height=["']?200/i,
];

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status });
}

function asText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function validateHtml(html: string): string[] {
  const errors: string[] = [];
  if (!/<!doctype html/i.test(html) || !/<html[\s>]/i.test(html)) errors.push("HTML chưa phải tài liệu độc lập.");
  if (!/THREE/i.test(html)) errors.push("Mã chưa có Three.js.");
  if (!/id=["']app["']/i.test(html)) errors.push("Mã chưa dùng vùng hiển thị #app.");
  for (const pattern of blockedPatterns) {
    if (pattern.test(html)) errors.push("Mã có thành phần không an toàn.");
  }
  const scriptSrcMatches = Array.from(html.matchAll(/<\s*script[^>]+src=["']([^"']+)["'][^>]*>/gi)).map((match) => match[1]);
  for (const src of scriptSrcMatches) {
    if (!allowedScriptSrc.includes(src)) errors.push("Mã dùng script ngoài danh sách cho phép.");
  }
  const externalMatches = Array.from(html.matchAll(/\b(?:src|href)=["'](https?:\/\/[^"']+)["']/gi)).map((match) => match[1]);
  for (const url of externalMatches) {
    if (!allowedScriptSrc.includes(url)) errors.push("Mã dùng tài nguyên ngoài chưa được cho phép.");
  }
  return [...new Set(errors)];
}

function normalizeResult(value: unknown): AnimationResult | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const html = asText(record.html);
  if (!html) return null;
  return {
    title: asText(record.title) || "Mô phỏng 3D",
    description: asText(record.description) || "Mô phỏng 3D đơn giản để minh họa bài học.",
    html,
    notes: Array.isArray(record.notes) ? record.notes.map(String).filter(Boolean) : [],
    warnings: Array.isArray(record.warnings) ? record.warnings.map(String).filter(Boolean) : [],
  };
}

function escapeHtml(text: string) {
  return text.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[char] || char));
}

function localHtml(input: { prompt: string; style: string }) {
  const title = input.prompt.toLowerCase().includes("trái đất") || input.prompt.toLowerCase().includes("mặt trời")
    ? "Mô phỏng Trái Đất quay quanh Mặt Trời"
    : input.prompt.toLowerCase().includes("lắc")
      ? "Mô phỏng con lắc đơn"
      : input.prompt.toLowerCase().includes("h2o") || input.prompt.toLowerCase().includes("nước")
        ? "Mô phỏng phân tử nước H2O"
        : input.prompt.toLowerCase().includes("ném")
          ? "Mô phỏng chuyển động ném xiên"
          : "Mô phỏng khối lập phương quay";
  const safePrompt = escapeHtml(input.prompt || "Mô phỏng 3D đơn giản");
  return `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>
    html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; font-family: Arial, sans-serif; background: #f8fafc; color: #0f172a; }
    #app { position: relative; width: 100vw; height: 100vh; overflow: hidden; background: linear-gradient(180deg, #f8fafc 0%, #eef6ff 100%); }
    canvas { display: block; width: 100%; height: 100%; }
    .info-panel { position: absolute; top: 16px; left: 16px; max-width: 360px; background: rgba(255, 255, 255, 0.92); border: 1px solid rgba(148, 163, 184, 0.35); border-radius: 14px; padding: 12px 14px; color: #0f172a; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08); }
    .info-panel h1 { margin: 0 0 6px; font-size: 16px; }
    .info-panel p { margin: 0; font-size: 13px; line-height: 1.45; color: #475569; }
    .controls { position: absolute; left: 50%; bottom: 16px; transform: translateX(-50%); display: flex; align-items: center; gap: 12px; background: rgba(255, 255, 255, 0.94); border: 1px solid rgba(148, 163, 184, 0.35); border-radius: 16px; padding: 10px 14px; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.10); }
    button { border: 0; border-radius: 999px; background: #2563eb; color: white; font-weight: 700; padding: 8px 12px; cursor: pointer; }
    label { font-size: 13px; font-weight: 700; color: #334155; }
    @media (max-width: 640px) { .info-panel { left: 10px; right: 10px; max-width: none; } .controls { bottom: 10px; width: calc(100% - 20px); justify-content: center; } }
  </style>
</head>
<body>
  <div id="app">
    <div class="info-panel">
      <h1>${escapeHtml(title)}</h1>
      <p>${safePrompt}</p>
    </div>
    <div class="controls">
      <button id="reset">Chạy lại</button>
      <label>Tốc độ <input id="speed" type="range" min="0.2" max="2.5" step="0.1" value="1" /></label>
    </div>
  </div>
  <script src="https://unpkg.com/three@0.160.0/build/three.min.js"></script>
  <script>
    // Mô phỏng 3D đơn giản do Soạn Lab tạo để minh họa ý tưởng bài học.
    const container = document.getElementById('app');
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 4, 9);
    camera.lookAt(0, 0, 0);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);
    const ambient = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambient);
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(4, 7, 6);
    scene.add(light);
    const grid = new THREE.GridHelper(8, 8, 0xcbd5e1, 0xe2e8f0);
    grid.position.y = -1.5;
    scene.add(grid);

    const group = new THREE.Group();
    scene.add(group);
    const prompt = ${JSON.stringify(input.prompt.toLowerCase())};
    const blue = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.45 });
    const orange = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.45, emissive: 0x7c2d12, emissiveIntensity: 0.18 });
    const white = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 });

    let mode = 'cube';
    if (prompt.includes('trái đất') || prompt.includes('mặt trời')) mode = 'orbit';
    if (prompt.includes('lắc')) mode = 'pendulum';
    if (prompt.includes('h2o') || prompt.includes('nước')) mode = 'molecule';
    if (prompt.includes('ném')) mode = 'projectile';

    let moving;
    if (mode === 'orbit') {
      const sun = new THREE.Mesh(new THREE.SphereGeometry(0.75, 40, 24), orange);
      group.add(sun);
      const orbit = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.01, 8, 120), new THREE.MeshBasicMaterial({ color: 0x94a3b8 }));
      orbit.rotation.x = Math.PI / 2;
      group.add(orbit);
      moving = new THREE.Mesh(new THREE.SphereGeometry(0.28, 32, 16), blue);
      group.add(moving);
    } else if (mode === 'pendulum') {
      const pivot = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 8), white);
      pivot.position.y = 1.8;
      group.add(pivot);
      const bob = new THREE.Mesh(new THREE.SphereGeometry(0.28, 32, 16), blue);
      const lineMaterial = new THREE.LineBasicMaterial({ color: 0x334155 });
      const geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 1.8, 0), new THREE.Vector3(0, -0.8, 0)]);
      const line = new THREE.Line(geometry, lineMaterial);
      group.add(line, bob);
      moving = { bob, line };
    } else if (mode === 'molecule') {
      const oxygen = new THREE.Mesh(new THREE.SphereGeometry(0.45, 32, 16), new THREE.MeshStandardMaterial({ color: 0xef4444 }));
      const h1 = new THREE.Mesh(new THREE.SphereGeometry(0.24, 24, 12), white);
      const h2 = h1.clone();
      h1.position.set(-0.8, -0.35, 0); h2.position.set(0.8, -0.35, 0);
      group.add(oxygen, h1, h2);
      moving = group;
    } else if (mode === 'projectile') {
      const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(-2.5,-0.9,0), new THREE.Vector3(-1,0.8,0), new THREE.Vector3(1,0.8,0), new THREE.Vector3(2.5,-0.9,0)]);
      const points = curve.getPoints(60);
      group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color: 0x2563eb })));
      moving = new THREE.Mesh(new THREE.SphereGeometry(0.18, 24, 12), orange);
      group.add(moving);
      moving.userData.curve = curve;
    } else {
      moving = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.6, 1.6), blue);
      group.add(moving);
    }

    let t = 0;
    const speed = document.getElementById('speed');
    document.getElementById('reset').onclick = () => { t = 0; };
    function resize() {
      const width = container.clientWidth || 800;
      const height = container.clientHeight || 520;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    }
    window.addEventListener('resize', resize);
    resize();
    function animate() {
      requestAnimationFrame(animate);
      t += 0.012 * Number(speed.value);
      if (mode === 'orbit') {
        moving.position.set(Math.cos(t) * 2.4, 0, Math.sin(t) * 2.4);
        moving.rotation.y += 0.03;
      } else if (mode === 'pendulum') {
        const angle = Math.sin(t * 1.6) * 0.65;
        const len = 2.6;
        const x = Math.sin(angle) * len;
        const y = 1.8 - Math.cos(angle) * len;
        moving.bob.position.set(x, y, 0);
        moving.line.geometry.setFromPoints([new THREE.Vector3(0, 1.8, 0), new THREE.Vector3(x, y, 0)]);
      } else if (mode === 'molecule') {
        group.rotation.y += 0.012 * Number(speed.value);
      } else if (mode === 'projectile') {
        const p = moving.userData.curve.getPoint((t * 0.22) % 1);
        moving.position.copy(p);
      } else {
        moving.rotation.x += 0.014 * Number(speed.value);
        moving.rotation.y += 0.018 * Number(speed.value);
      }
      renderer.render(scene, camera);
    }
    animate();
  </script>
</body>
</html>`;
}

function localResult(input: { prompt: string; style: string; simulationType?: string }): AnimationResult {
  const intent = detectGeometryShapeIntent(input.prompt);
  const template = intent ? buildGeometryTemplate({ prompt: input.prompt, style: input.style, intent }) : null;
  if (template) return template;
  return {
    title: "Mô phỏng 3D minh họa",
    description: "Mô phỏng 3D đơn giản để giáo viên xem thử, chỉnh sửa hoặc tải file HTML.",
    html: localHtml(input),
    notes: ["Có thể copy hoặc tải file HTML để chạy độc lập."],
    warnings: ["Mô phỏng là bản nháp minh họa, cần kiểm tra lại tính đúng đắn trước khi dùng trong bài giảng."],
  };
}

async function buildResult(input: { prompt: string; subject: string; grade: string; objective: string; style: string; simulationType: string }) {
  const intent = detectGeometryShapeIntent(input.prompt);
  const deterministicTemplate = intent ? buildGeometryTemplate({ prompt: input.prompt, style: input.style, intent }) : null;
  if (deterministicTemplate) return deterministicTemplate;

  const provider = getConfiguredProvider();
  if (provider.name === "local") return localResult(input);

  let response;
  try {
    response = await provider.generate({
      tool: "3d-animation",
      input,
      prompt: buildThreeDAnimationPrompt(input),
    });
  } catch {
    return {
      ...localResult(input),
      warnings: ["Soạn Lab đã dùng mô phỏng minh họa an toàn cơ bản để thầy cô tiếp tục xem trước và chỉnh sửa."],
    };
  }
  const parsed = extractJson(response.content);
  if (!parsed.ok) return localResult(input);
  const result = normalizeResult(parsed.value) ?? localResult(input);
  const errors = validateHtml(result.html);
  if (errors.length) return { ...localResult(input), warnings: ["Mã do hệ thống tạo chưa đạt kiểm tra an toàn nên Soạn Lab đã dùng mô phỏng an toàn cơ bản."] };
  if (intent && hasGeometryTemplateMismatch(intent.intent, result.html)) {
    return buildGeometryTemplate({ prompt: input.prompt, style: input.style, intent }) ?? localResult(input);
  }
  return result;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const prompt = asText(body.prompt);
    if (prompt.length < 8) return json({ ok: false, error: "Vui lòng nhập mô tả mô phỏng rõ hơn." }, 400);
    const input = {
      prompt: prompt.slice(0, 3000),
      subject: asText(body.subject).slice(0, 120),
      grade: asText(body.grade).slice(0, 40),
      objective: asText(body.objective).slice(0, 500),
      style: asText(body.style) || "Đơn giản",
      simulationType: asText(body.simulationType) || "Tự động",
    };
    const result = await buildResult(input);
    const safetyErrors = validateHtml(result.html);
    if (safetyErrors.length) {
      return json({ ok: false, error: "Chưa tạo được mô phỏng an toàn. Vui lòng thử mô tả ngắn gọn và rõ hơn." }, 400);
    }
    return json({ ok: true, ...result });
  } catch {
    return json({ ok: false, error: "Chưa tạo được mô phỏng. Vui lòng thử mô tả ngắn gọn và rõ hơn." }, 500);
  }
}
