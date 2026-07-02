export function getHeaders(onBehalfOfToken: string) {
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Bearer ${onBehalfOfToken}`,
    connection: "keep-alive",
  };
}
