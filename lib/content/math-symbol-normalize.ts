const mojibakeMathMap: Array<[RegExp, string]> = [
  [/â†”/g, "↔"],
  [/â†’/g, "→"],
  [/â‡’/g, "⇒"],
  [/â‡”/g, "⇔"],
  [/âˆ€/g, "∀"],
  [/âˆƒ/g, "∃"],
  [/âˆˆ/g, "∈"],
  [/âˆ‰/g, "∉"],
  [/âˆš/g, "√"],
  [/âˆ’/g, "−"],
  [/â‰¤/g, "≤"],
  [/â‰¥/g, "≥"],
  [/â‰ /g, "≠"],
  [/â‰ /g, "≠"],
  [/â‰ˆ/g, "≈"],
  [/âˆ†/g, "∆"],
  [/âˆž/g, "∞"],
  [/Â±/g, "±"],
  [/Î”/g, "Δ"],
  [/Î´/g, "δ"],
  [/Ï€/g, "π"],
  [/Ïƒ/g, "σ"],
  [/Ï‰/g, "ω"],
  [/Ï†/g, "φ"],
  [/Â·/g, "·"],
];

function fixReplacementInLogicContext(text: string) {
  return text
    .replace(/\b([A-Zpqrstxyz])\s*(?:�|ï¿½)\s*([A-Zpqrstxyz])\b/g, "$1 ↔ $2")
    .replace(/\b([A-Z])\s*\?\s*([A-Z])\b/g, "$1 ↔ $2");
}

export function normalizeMathSymbols(value: string) {
  let text = value.normalize("NFC");
  for (const [pattern, replacement] of mojibakeMathMap) {
    text = text.replace(pattern, replacement);
  }
  return fixReplacementInLogicContext(text);
}

export function containsMathLikeText(value: string) {
  return /[∀∃∈∉⇒⇔↔≤≥≠√πΔ±∞≈]|\\\(|\\\[|\\frac|\\sqrt|\b[a-zA-Z]\s*[=<>]\s*|\^|_[{a-zA-Z0-9]/.test(value);
}
