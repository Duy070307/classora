const PRODUCTION_SITE_URL = "https://soanlab.ducduytran.shop";

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function isLocalUrl(value: string) {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(value);
}

export function getSiteUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.SITE_URL || process.env.APP_URL;
  if (configuredUrl) {
    const normalizedUrl = trimTrailingSlash(configuredUrl);
    if (process.env.NODE_ENV !== "production" || !isLocalUrl(normalizedUrl)) return normalizedUrl;
  }

  if (process.env.VERCEL_URL) return `https://${trimTrailingSlash(process.env.VERCEL_URL)}`;

  return process.env.NODE_ENV === "production" ? PRODUCTION_SITE_URL : "http://localhost:3000";
}

export function getRequestOrigin(request: Request) {
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const host = forwardedHost || request.headers.get("host")?.split(",")[0]?.trim();
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const proto = forwardedProto || new URL(request.url).protocol.replace(":", "") || "https";
  const origin = host ? `${proto}://${host}` : new URL(request.url).origin;

  if (process.env.NODE_ENV === "production" && isLocalUrl(origin)) return getSiteUrl();
  return trimTrailingSlash(origin);
}
