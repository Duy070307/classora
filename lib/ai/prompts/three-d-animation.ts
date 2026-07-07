export type ThreeDAnimationPromptInput = {
  prompt: string;
  subject?: string;
  grade?: string;
  objective?: string;
  style?: string;
};

export function buildThreeDAnimationPrompt(input: ThreeDAnimationPromptInput) {
  return `Bạn đang tạo một mô phỏng 3D giáo dục an toàn cho giáo viên Việt Nam.

Trả về JSON thuần, không markdown fence, theo schema:
{
  "title": "Tên mô phỏng",
  "description": "Mô tả ngắn",
  "html": "Tài liệu HTML hoàn chỉnh",
  "notes": ["Ghi chú sử dụng"],
  "warnings": ["Cảnh báo nếu mô hình chỉ gần đúng"]
}

Yêu cầu HTML:
- "html" phải là một file HTML độc lập đầy đủ: <!doctype html>, html, head, body, style, script.
- HTML phải lấp đầy toàn bộ vùng iframe, không để canvas bị đẩy xuống dưới hoặc chỉ chiếm một phần nhỏ.
- CSS bắt buộc: html và body có margin: 0, padding: 0, width: 100%, height: 100%, overflow: hidden, font-family: Arial, sans-serif, background: #f8fafc.
- Dùng đúng một root div id="app" với position: relative, width: 100vw, height: 100vh, overflow: hidden.
- Canvas phải display: block, width: 100%, height: 100%.
- Gắn renderer vào #app, không đặt canvas trong normal document flow cùng panel/control.
- Info panel và controls phải dùng position: absolute; panel ở top/left, controls ở bottom center; không được làm thay đổi layout canvas.
- Mẫu camera/renderer nên dùng:
  const container = document.getElementById("app");
  const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
  camera.position.set(0, 4, 9);
  camera.lookAt(0, 0, 0);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);
  window.addEventListener("resize", () => { camera.aspect = container.clientWidth / container.clientHeight; camera.updateProjectionMatrix(); renderer.setSize(container.clientWidth, container.clientHeight); });
- Main scene phải đặt quanh gốc tọa độ (0, 0, 0); camera phải nhìn vào gốc tọa độ.
- Đối tượng chính phải nằm ở vùng giữa viewport, không đặt quá thấp, không tạo khoảng trống lớn phía trên.
- Orbit/path nên centered quanh origin. Với hệ Mặt Trời: Sun tại (0,0,0), Earth orbit radius khoảng 3, camera khoảng (0,5,8) hoặc (0,6,10).
- Dùng đèn đơn giản từ trước/trên; GridHelper chỉ dùng khi không lấn át hình chính.
- Không dùng chiều cao canvas hardcoded 200px, không để CSS làm canvas nhỏ hơn preview, không đặt controls trong normal flow trên/dưới canvas.
- Dùng Three.js từ CDN chính thức/ổn định: https://unpkg.com/three@0.160.0/build/three.min.js hoặc https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js.
- Không dùng external API ngoài CDN Three.js.
- Không tracking, không fetch, không XMLHttpRequest, không gửi dữ liệu.
- Không dùng ảnh ngoài, iframe, embed, object, form.
- Không dùng eval, Function, document.cookie, localStorage, sessionStorage, window.top, window.parent, navigation.
- Giữ animation nhẹ, không tạo object mới liên tục trong animation loop.
- Dùng hình học đơn giản: sphere, cube, cone, cylinder, torus, line, curve.
- Thêm chú thích/comment tiếng Việt trong code.
- Dùng nhãn giáo dục khi hữu ích, có thể dùng HTML overlay trong chính file.
- Màu trung tính, dễ nhìn, không quá rực.
- Nếu đơn giản, thêm thanh tốc độ và nút đặt lại/chạy lại trong preview.

Yêu cầu giáo dục:
- Ưu tiên minh họa ý tưởng, rõ ràng hơn là đẹp mắt.
- Nếu nội dung khoa học, mô hình có thể gần đúng; thêm warning phù hợp.
- Không tự bịa số đo chính xác nếu người dùng không cung cấp.
- Không hứa chính xác tuyệt đối.

Thông tin yêu cầu:
- Mô tả: ${input.prompt}
- Môn học: ${input.subject || "Không nêu"}
- Lớp: ${input.grade || "Không nêu"}
- Mục tiêu minh họa: ${input.objective || "Không nêu"}
- Phong cách hiển thị: ${input.style || "Đơn giản"}`;
}
