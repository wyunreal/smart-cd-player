import path from "path";

/**
 * Builds a Set of allowed origins from environment variables.
 */
const buildAllowedOrigins = (
  ...envVarNames: (string | undefined)[]
): Set<string> => {
  const origins = new Set<string>();
  for (const value of envVarNames) {
    if (!value) continue;
    for (const entry of value.split(",")) {
      const trimmed = entry.trim();
      if (!trimmed) continue;
      try {
        const url = new URL(trimmed);
        origins.add(url.origin);
      } catch {
        // Skip invalid URLs
      }
    }
  }
  return origins;
};

/**
 * Validates a URL against the proxy allowlist.
 * Allowed origins: COMPOSITE_VIDEO_PARSER_URL + ALLOWED_PROXY_ORIGINS (comma-separated).
 * Also allows any .local mDNS hostname (local network devices discovered via Avahi).
 * Only http: and https: schemes are permitted.
 */
export const isAllowedProxyUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }
    // Allow .local mDNS hostnames (local network hardware devices)
    if (parsed.hostname.endsWith(".local")) {
      return true;
    }
    const allowed = buildAllowedOrigins(
      process.env.COMPOSITE_VIDEO_PARSER_URL,
      process.env.ALLOWED_PROXY_ORIGINS,
    );
    return allowed.has(parsed.origin);
  } catch {
    return false;
  }
};

/**
 * Validates a URL against the image download allowlist.
 * Allowed origins: known CDNs (Spotify, Discogs, Google) + ALLOWED_IMAGE_ORIGINS.
 * Only https: scheme is permitted.
 */
export const isAllowedImageUrl = (url: string): boolean => {
  const BUILTIN_IMAGE_ORIGINS = [
    "https://i.scdn.co",
    "https://i.discogs.com",
    "https://lh3.googleusercontent.com",
  ];

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") {
      return false;
    }
    const allowed = buildAllowedOrigins(
      BUILTIN_IMAGE_ORIGINS.join(","),
      process.env.ALLOWED_IMAGE_ORIGINS,
    );
    return allowed.has(parsed.origin);
  } catch {
    return false;
  }
};

/**
 * Sanitizes a filename by extracting the basename and replacing
 * characters that are not alphanumeric, dots, hyphens, or underscores.
 */
export const sanitizeFilename = (filename: string): string => {
  const base = path.basename(filename);
  return base.replace(/[^a-zA-Z0-9._-]/g, "_");
};

/**
 * Checks whether a file path resolves to a location within the given directory.
 */
export const isPathWithinDir = (filePath: string, dir: string): boolean => {
  const resolvedPath = path.resolve(filePath);
  const resolvedDir = path.resolve(dir);
  return resolvedPath.startsWith(resolvedDir + path.sep) || resolvedPath === resolvedDir;
};

