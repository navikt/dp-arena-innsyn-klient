import { register } from "prom-client";

export async function loader() {
  return new Response(await register.metrics(), {
    headers: {
      "Content-Type": register.contentType,
    },
  });
}
