import { QueryClient } from "@tanstack/react-query";

import { oppgaverQueryKey } from "~/api/oppgave-hooks";
import { hentOppgaver } from "~/models/saksbehandling.server";
import { mineOppgaverDefaultParams } from "~/routes/mine-oppgaver";

import { convertToQueryParamString } from "./url.utils";

export const prefetchDataForRoute = async (
  url: URL,
  request: Request,
  queryClient: QueryClient,
) => {
  if (url.pathname.startsWith("/mine-oppgaver")) {
    const mineOppgaverParams = new URLSearchParams(
      "?" + convertToQueryParamString(mineOppgaverDefaultParams),
    );

    // Let errors be stored in the query cache (no try/catch here)
    await queryClient.prefetchQuery({
      queryKey: oppgaverQueryKey(mineOppgaverParams),
      queryFn: () => hentOppgaver(request, mineOppgaverParams),
    });
  } else if (url.pathname.startsWith("/alle-oppgaver")) {
    await queryClient.prefetchQuery({
      queryKey: oppgaverQueryKey(url.searchParams),
      queryFn: () => hentOppgaver(request, url.searchParams),
    });
  } else if (url.pathname === "/") {
    await queryClient.prefetchQuery({
      queryKey: oppgaverQueryKey(url.searchParams),
      queryFn: () => hentOppgaver(request, url.searchParams),
    });
  }
  return queryClient;
};
