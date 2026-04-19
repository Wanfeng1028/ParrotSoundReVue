const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export const resolveMediaUrl = (url: string) => {
  if (!url) {
    return "";
  }

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  return `${apiBaseUrl}${url.startsWith("/") ? url : `/${url}`}`;
};

export const downloadMediaUrl = (url: string, filename?: string) => {
  const target = resolveMediaUrl(url);
  if (!target) {
    return;
  }

  const link = document.createElement("a");
  link.href = target;
  link.download = filename || "";
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
