import type { DetectedShapeIntent, GeometryShapeIntent } from "@/lib/geometry/shape-intent";

type TemplateInput = {
  prompt: string;
  style?: string;
  intent: DetectedShapeIntent;
};

type ThreeTemplateResult = {
  title: string;
  description: string;
  html: string;
  notes: string[];
  warnings: string[];
};

function escapeHtml(text: string) {
  return text.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[char] || char));
}

function hasSlowRotation(text: string) {
  const lower = text.toLowerCase();
  return lower.includes("chậm") || lower.includes("cham") || lower.includes("slow");
}

function accentColor(text: string) {
  const lower = text.toLowerCase();
  if (lower.includes("xanh lá") || lower.includes("xanh la")) return "0x16a34a";
  if (lower.includes("xanh")) return "0x2563eb";
  if (lower.includes("đỏ") || lower.includes("do ")) return "0xdc2626";
  if (lower.includes("vàng") || lower.includes("vang")) return "0xf59e0b";
  if (lower.includes("tím") || lower.includes("tim")) return "0x7c3aed";
  return "0x2563eb";
}

function intentTitle(intent: GeometryShapeIntent) {
  const titles: Record<GeometryShapeIntent, string> = {
    cube: "Mô hình hình lập phương",
    rectangular_prism: "Mô hình hình hộp chữ nhật",
    pyramid: "Mô hình hình chóp",
    truncated_pyramid: "Mô hình hình chóp cụt",
    cone: "Mô hình hình nón",
    truncated_cone: "Mô hình hình nón cụt",
    cylinder: "Mô hình hình trụ",
    sphere: "Mô hình hình cầu",
    prism: "Mô hình lăng trụ tam giác",
    frustum_general: "Mô hình hình cụt",
  };
  return titles[intent];
}

function shapeScript(intent: GeometryShapeIntent) {
  switch (intent) {
    case "truncated_pyramid":
    case "frustum_general":
      return `
    // Hình chóp cụt: đáy lớn ở dưới, đáy nhỏ ở trên, bốn mặt bên là hình thang.
    const vertices = new Float32Array([
      -2, 0, -2,   2, 0, -2,   2, 0, 2,   -2, 0, 2,
      -1, 2.2, -1, 1, 2.2, -1, 1, 2.2, 1, -1, 2.2, 1
    ]);
    const indices = [
      0, 2, 1, 0, 3, 2,
      4, 5, 6, 4, 6, 7,
      0, 1, 5, 0, 5, 4,
      1, 2, 6, 1, 6, 5,
      2, 3, 7, 2, 7, 6,
      3, 0, 4, 3, 4, 7
    ];
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    const solid = new THREE.Mesh(geometry, bodyMaterial);
    group.add(solid);
    group.add(new THREE.LineSegments(new THREE.EdgesGeometry(geometry), edgeMaterial));
    addHeightLine(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 2.2, 0));
    addLabel('Đáy lớn', new THREE.Vector3(0, -0.15, 2.35));
    addLabel('Đáy nhỏ', new THREE.Vector3(0, 2.45, 1.25));
    addLabel('Mặt bên', new THREE.Vector3(2.25, 1.1, 0));
    addLabel('h', new THREE.Vector3(0.25, 1.15, 0));
`;
    case "truncated_cone":
      return `
    // Hình nón cụt: dùng CylinderGeometry với bán kính trên nhỏ hơn bán kính dưới.
    const geometry = new THREE.CylinderGeometry(1, 2, 2.4, 80, 1, false);
    const solid = new THREE.Mesh(geometry, bodyMaterial);
    solid.position.y = 1.2;
    group.add(solid);
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), edgeMaterial);
    edges.position.copy(solid.position);
    group.add(edges);
    addHeightLine(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 2.4, 0));
    addSlantLine(new THREE.Vector3(2, 0, 0), new THREE.Vector3(1, 2.4, 0));
    addLabel('Đáy lớn', new THREE.Vector3(0, -0.15, 2.2));
    addLabel('Đáy nhỏ', new THREE.Vector3(0, 2.6, 1.2));
    addLabel('Đường sinh', new THREE.Vector3(1.75, 1.25, 0.3));
    addLabel('h', new THREE.Vector3(0.25, 1.2, 0));
`;
    case "pyramid":
      return `
    // Hình chóp tứ giác: một đỉnh và một đáy vuông.
    const vertices = new Float32Array([
      -2, 0, -2, 2, 0, -2, 2, 0, 2, -2, 0, 2,
      0, 2.8, 0
    ]);
    const indices = [0, 2, 1, 0, 3, 2, 0, 1, 4, 1, 2, 4, 2, 3, 4, 3, 0, 4];
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    group.add(new THREE.Mesh(geometry, bodyMaterial));
    group.add(new THREE.LineSegments(new THREE.EdgesGeometry(geometry), edgeMaterial));
    addHeightLine(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 2.8, 0));
    addLabel('Đáy', new THREE.Vector3(0, -0.15, 2.35));
    addLabel('Đỉnh', new THREE.Vector3(0, 3.05, 0));
    addLabel('Mặt bên', new THREE.Vector3(1.55, 1.2, 0.6));
`;
    case "cone":
      return `
    // Hình nón: một đỉnh và một đáy tròn.
    const geometry = new THREE.ConeGeometry(1.8, 2.8, 80);
    const solid = new THREE.Mesh(geometry, bodyMaterial);
    solid.position.y = 1.4;
    group.add(solid);
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), edgeMaterial);
    edges.position.copy(solid.position);
    group.add(edges);
    addSlantLine(new THREE.Vector3(1.8, 0, 0), new THREE.Vector3(0, 2.8, 0));
    addLabel('Đỉnh', new THREE.Vector3(0, 3.05, 0));
    addLabel('Đáy', new THREE.Vector3(0, -0.15, 2));
    addLabel('Đường sinh', new THREE.Vector3(1.45, 1.45, 0.3));
`;
    case "cylinder":
      return `
    // Hình trụ: hai đáy tròn song song và chiều cao h.
    const geometry = new THREE.CylinderGeometry(1.4, 1.4, 2.8, 80);
    const solid = new THREE.Mesh(geometry, bodyMaterial);
    solid.position.y = 1.4;
    group.add(solid);
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), edgeMaterial);
    edges.position.copy(solid.position);
    group.add(edges);
    addHeightLine(new THREE.Vector3(-1.7, 0, 0), new THREE.Vector3(-1.7, 2.8, 0));
    addLabel('Đáy', new THREE.Vector3(0, -0.15, 1.65));
    addLabel('Chiều cao h', new THREE.Vector3(-2.15, 1.45, 0));
`;
    case "sphere":
      return `
    // Hình cầu với tâm O và bán kính r.
    const geometry = new THREE.SphereGeometry(1.7, 64, 32);
    const solid = new THREE.Mesh(geometry, bodyMaterial);
    solid.position.y = 1.2;
    group.add(solid);
    const equator = new THREE.Mesh(new THREE.TorusGeometry(1.7, 0.012, 8, 120), new THREE.MeshBasicMaterial({ color: 0x1e293b }));
    equator.position.copy(solid.position);
    equator.rotation.x = Math.PI / 2;
    group.add(equator);
    addSlantLine(new THREE.Vector3(0, 1.2, 0), new THREE.Vector3(1.7, 1.2, 0));
    addLabel('Tâm O', new THREE.Vector3(0, 1.2, 0));
    addLabel('Bán kính r', new THREE.Vector3(0.95, 1.35, 0));
`;
    case "rectangular_prism":
      return `
    // Hình hộp chữ nhật với ba kích thước khác nhau.
    const geometry = new THREE.BoxGeometry(3.2, 1.8, 2.2);
    const solid = new THREE.Mesh(geometry, bodyMaterial);
    solid.position.y = 0.9;
    group.add(solid);
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), edgeMaterial);
    edges.position.copy(solid.position);
    group.add(edges);
    addLabel('dài', new THREE.Vector3(0, -0.15, 1.35));
    addLabel('rộng', new THREE.Vector3(1.9, 0.25, 0));
    addLabel('cao', new THREE.Vector3(-1.9, 1.1, 0));
`;
    case "prism":
      return `
    // Lăng trụ tam giác: hai đáy tam giác song song và các mặt bên.
    const vertices = new Float32Array([
      -1.6, 0, -1.2, 1.6, 0, -1.2, 0, 1.8, -1.2,
      -1.6, 0, 1.2, 1.6, 0, 1.2, 0, 1.8, 1.2
    ]);
    const indices = [
      0, 1, 2, 3, 5, 4,
      0, 3, 4, 0, 4, 1,
      1, 4, 5, 1, 5, 2,
      2, 5, 3, 2, 3, 0
    ];
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    group.add(new THREE.Mesh(geometry, bodyMaterial));
    group.add(new THREE.LineSegments(new THREE.EdgesGeometry(geometry), edgeMaterial));
    addLabel('Đáy tam giác', new THREE.Vector3(0, 0.9, -1.55));
    addLabel('Đáy song song', new THREE.Vector3(0, 0.9, 1.55));
    addLabel('Mặt bên', new THREE.Vector3(1.85, 0.85, 0));
`;
    case "cube":
    default:
      return `
    // Hình lập phương: các cạnh bằng nhau.
    const geometry = new THREE.BoxGeometry(2.2, 2.2, 2.2);
    const solid = new THREE.Mesh(geometry, bodyMaterial);
    solid.position.y = 1.1;
    group.add(solid);
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), edgeMaterial);
    edges.position.copy(solid.position);
    group.add(edges);
    addLabel('Cạnh a', new THREE.Vector3(0, -0.15, 1.35));
`;
  }
}

function buildHtml(input: TemplateInput) {
  const title = intentTitle(input.intent.intent);
  const safePrompt = escapeHtml(input.prompt);
  const color = accentColor(input.prompt);
  const rotationStep = hasSlowRotation(input.prompt) ? "0.004" : "0.01";
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
    .info-panel { position: absolute; top: 16px; left: 16px; max-width: 380px; background: rgba(255, 255, 255, 0.93); border: 1px solid rgba(148, 163, 184, 0.35); border-radius: 14px; padding: 12px 14px; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08); }
    .info-panel h1 { margin: 0 0 6px; font-size: 16px; color: #0f172a; }
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
      <p>${safePrompt || "Mô hình hình học 3D minh họa."}</p>
    </div>
    <div class="controls">
      <button id="reset">Chạy lại</button>
      <label>Tốc độ <input id="speed" type="range" min="0" max="2" step="0.1" value="1" /></label>
    </div>
  </div>
  <script src="https://unpkg.com/three@0.160.0/build/three.min.js"></script>
  <script>
    // Mô hình hình học 3D là bản minh họa để quan sát, không phải bản vẽ kỹ thuật chính xác tuyệt đối.
    const container = document.getElementById('app');
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(4.8, 4.2, 7.2);
    camera.lookAt(0, 1, 0);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.78));
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(4, 8, 6);
    scene.add(light);
    const fill = new THREE.DirectionalLight(0xdbeafe, 0.45);
    fill.position.set(-4, 3, -5);
    scene.add(fill);

    const grid = new THREE.GridHelper(7, 7, 0xcbd5e1, 0xe2e8f0);
    grid.position.y = -0.02;
    scene.add(grid);

    const group = new THREE.Group();
    group.position.y = -0.4;
    scene.add(group);

    const bodyMaterial = new THREE.MeshStandardMaterial({ color: ${color}, roughness: 0.48, metalness: 0.03, transparent: true, opacity: 0.72, side: THREE.DoubleSide });
    const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x0f172a, linewidth: 1 });
    const helperMaterial = new THREE.LineBasicMaterial({ color: 0xef4444 });

    function addLabel(text, position) {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 160;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.strokeStyle = 'rgba(37,99,235,0.55)';
      ctx.lineWidth = 5;
      roundRect(ctx, 20, 36, 472, 82, 28);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 42px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 256, 78);
      const texture = new THREE.CanvasTexture(canvas);
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true }));
      sprite.position.copy(position);
      sprite.scale.set(1.5, 0.48, 1);
      group.add(sprite);
    }

    function roundRect(ctx, x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    }

    function addHeightLine(start, end) {
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([start, end]), helperMaterial);
      group.add(line);
    }

    function addSlantLine(start, end) {
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([start, end]), helperMaterial);
      group.add(line);
    }

${shapeScript(input.intent.intent)}

    let t = 0;
    const speed = document.getElementById('speed');
    document.getElementById('reset').onclick = () => { t = 0; group.rotation.y = 0; };

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
      t += ${rotationStep} * Number(speed.value);
      group.rotation.y = t;
      renderer.render(scene, camera);
    }
    animate();
  </script>
</body>
</html>`;
}

export function buildGeometryTemplate(input: TemplateInput): ThreeTemplateResult | null {
  const supported: GeometryShapeIntent[] = [
    "cube",
    "rectangular_prism",
    "pyramid",
    "truncated_pyramid",
    "cone",
    "truncated_cone",
    "cylinder",
    "sphere",
    "prism",
    "frustum_general",
  ];
  if (!supported.includes(input.intent.intent)) return null;
  const title = intentTitle(input.intent.intent);
  return {
    title,
    description: `${title} dạng minh họa 3D đơn giản để quan sát trong bài học.`,
    html: buildHtml(input),
    notes: ["Có thể xoay/chạy lại preview và tải file HTML để dùng độc lập.", "Mô hình ưu tiên đúng dạng khối hình học theo mô tả tiếng Việt của giáo viên."],
    warnings: ["Mô hình hình học 3D là bản minh họa để quan sát. Thầy cô cần kiểm tra lại kích thước, tỉ lệ và ký hiệu trước khi sử dụng."],
  };
}

export function hasGeometryTemplateMismatch(intent: GeometryShapeIntent, html: string) {
  if (intent === "truncated_pyramid") {
    return /BoxGeometry/i.test(html) && !/BufferGeometry|chóp cụt|chop cut|frustum|hình thang/i.test(html);
  }
  if (intent === "truncated_cone") {
    return /BoxGeometry/i.test(html) || !/CylinderGeometry\s*\(\s*[^,\s]+,\s*[^,\s]+/i.test(html);
  }
  if (intent === "rectangular_prism") {
    return /BoxGeometry\s*\(\s*([0-9.]+)\s*,\s*\1\s*,\s*\1\s*\)/i.test(html);
  }
  return false;
}
