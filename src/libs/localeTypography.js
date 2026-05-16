export const normalizeLocaleLang = (lang = "") => {
  const normalized = String(lang).trim().toLowerCase();

  if (!normalized) return "";
  if (
    normalized === "zh" ||
    normalized === "zh-cn" ||
    normalized === "zh-hans"
  ) {
    return "zh-CN";
  }
  if (
    normalized === "zh-tw" ||
    normalized === "zh-hk" ||
    normalized === "zh-mo" ||
    normalized === "zh-hant"
  ) {
    return "zh-TW";
  }
  if (normalized.startsWith("ja")) return "ja";
  if (normalized.startsWith("ko")) return "ko";

  return lang;
};

export const applyLocaleTypography = (element, lang = "") => {
  if (!element) return;

  const normalizedLang = normalizeLocaleLang(lang);
  if (normalizedLang) {
    element.setAttribute("lang", normalizedLang);
  }
};
