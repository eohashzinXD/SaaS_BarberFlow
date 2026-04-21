export function buildRedirectUrl(pathname: string, params: Record<string, string | undefined>) {
  const url = new URL(pathname, "http://localhost");

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      url.searchParams.set(key, value);
    }
  }

  return `${url.pathname}${url.search}`;
}

export function getFlashFromSearchParams(
  searchParams: Record<string, string | string[] | undefined>
) {
  const success = typeof searchParams.success === "string" ? searchParams.success : undefined;
  const error = typeof searchParams.error === "string" ? searchParams.error : undefined;

  return {
    success,
    error
  };
}
