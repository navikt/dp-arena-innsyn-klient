export function appendSearchParamIfNotExists(
  params: URLSearchParams,
  key: string,
  value: string,
): boolean {
  if (!params.has(key) || !params.getAll(key).includes(value)) {
    params.append(key, value);
    return true;
  }
  return false;
}

export function convertToQueryParamString(params: { key: string; value: string }[]): string {
  const searchParams = new URLSearchParams();

  params.forEach((param) => {
    searchParams.append(param.key, param.value);
  });

  return searchParams.toString();
}
