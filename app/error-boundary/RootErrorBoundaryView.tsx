import { Alert, BodyLong, Heading, InternalHeader, Theme } from "@navikt/ds-react";
import type { JSX } from "react";
import { isRouteErrorResponse, Link } from "react-router";

interface IProps {
  meta: JSX.Element;
  links: JSX.Element;
  error: unknown;
}

export function RootErrorBoundaryView({ meta, links, error }: IProps) {
  return (
    <Theme>
      <head>
        {meta}
        {links}
        <title>Dagpenger</title>
      </head>

      <InternalHeader>
        <Link to={"/"} className={"flex items-center"}>
          <InternalHeader.Title as="h1">Dagpenger</InternalHeader.Title>
        </Link>
      </InternalHeader>

      <div className={"p-4"}>
        <ErrorMessageComponent error={error} />
      </div>
    </Theme>
  );
}

export function ErrorMessageComponent({ error }: { error: unknown }) {
  // Treffer Response errors, eks. throw new Response(), 401, 404, 500 errors
  if (isRouteErrorResponse(error)) {
    return (
      <Alert className={"m-4"} variant="error">
        <Heading spacing size="medium" level="1">
          {`${error.status} ${error.statusText}`}
        </Heading>
        <BodyLong>{error.data}</BodyLong>
      </Alert>
    );
  }

  // Treffer Uncaught-exceptions, eks. feil ved import, throw new Error()
  if (error instanceof Error) {
    return (
      <Alert className={"m-4"} variant="error">
        <Heading spacing size="medium" level="1">
          {error.name}
        </Heading>
        <BodyLong>{error.message}</BodyLong>

        {error.stack && <pre className={"mt-2"}>{error.stack}</pre>}
      </Alert>
    );
  }

  return (
    <Alert className={"m-4"} variant="error">
      <Heading spacing size="medium" level="1">
        Ukjent feil
      </Heading>
    </Alert>
  );
}
