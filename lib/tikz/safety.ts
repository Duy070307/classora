const MAX_TIKZ_LENGTH = 60_000;

const blockedCommands: Array<{ code: string; pattern: RegExp }> = [
  { code: "shell_escape", pattern: /\\write\s*18\b/i },
  { code: "file_write", pattern: /\\(?:write|immediate)(?![A-Za-z@])/i },
  { code: "file_open", pattern: /\\(?:openin|openout)(?![A-Za-z@])/i },
  { code: "file_read", pattern: /\\read(?![A-Za-z@])/i },
  { code: "process_input", pattern: /\\(?:input|include)\s*(?:\{|\s)(?!\s*(?:tikz|pgf)?library)/i },
  { code: "package_install", pattern: /\\usepackage\s*\{(?:shellesc|catchfile|verbatimbox)\}/i },
  { code: "network_resource", pattern: /(?:https?|ftp):\/\//i },
  { code: "path_traversal", pattern: /(?:\.\.\/|\.\.\\)/ },
  { code: "external_graphics", pattern: /\\includegraphics\b/i },
  { code: "externalization", pattern: /\\tikzexternalize\b/i },
  { code: "lua_execution", pattern: /\\directlua\b/i },
  { code: "catcode_change", pattern: /\\catcode(?![A-Za-z@])/i },
  { code: "dynamic_command", pattern: /\\(?:csname|newread|newwrite|everyjob)(?![A-Za-z@])/i },
  { code: "file_protocol", pattern: /file:\/\//i },
  { code: "absolute_path", pattern: /(?:^|[\s{=])(?:[A-Za-z]:[\\/]|\/(?:etc|proc|sys|dev|home|root|tmp)\/)/i },
  { code: "pipe_execution", pattern: /(?:\|\s*(?:sh|bash|cmd|powershell)|`[^`]+`)/i },
];

const allowedPackages = new Set(["tikz", "amsmath", "amssymb", "xcolor"]);

export function inspectTikzSafety(code: string) {
  const issues: Array<{ code: string; message: string }> = [];
  if (code.length > MAX_TIKZ_LENGTH) issues.push({ code: "source_too_long", message: "Mã TikZ vượt quá giới hạn an toàn 60.000 ký tự." });
  for (const blocked of blockedCommands) {
    if (blocked.pattern.test(code)) issues.push({ code: blocked.code, message: "Mã chứa lệnh hoặc tài nguyên không được hỗ trợ vì lý do an toàn." });
  }
  for (const match of code.matchAll(/\\usepackage(?:\[[^\]]*\])?\{([^}]+)\}/gi)) {
    for (const name of match[1].split(",").map((item) => item.trim()).filter(Boolean)) {
      if (!allowedPackages.has(name)) issues.push({ code: "package_not_allowed", message: `Gói LaTeX “${name}” chưa được phép trong môi trường an toàn.` });
    }
  }
  return { safe: issues.length === 0, issues, maximumLength: MAX_TIKZ_LENGTH };
}

export function sanitizeDownloadName(value: string, fallback = "soan-lab-tikz") {
  const clean = value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/gi, "d")
    .replace(/[^a-z0-9_-]+/gi, "-").replace(/^-+|-+$/g, "").slice(0, 80).toLowerCase();
  return clean || fallback;
}
