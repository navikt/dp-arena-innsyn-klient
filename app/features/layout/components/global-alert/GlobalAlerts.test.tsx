// @vitest-environment happy-dom
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { GlobalAlerts } from "~/features/layout/components/global-alert/GlobalAlerts";
import { AlertContext, type IAlert } from "~/features/layout/context/alert-context";

function renderMedAlerts(alerts: IAlert[], removeAlert = vi.fn()) {
  return {
    removeAlert,
    ...render(
      <AlertContext.Provider value={{ alerts, addAlert: vi.fn(), removeAlert }}>
        <GlobalAlerts />
      </AlertContext.Provider>,
    ),
  };
}

describe("GlobalAlerts", () => {
  it("viser tittel, body og service for hver alert", () => {
    renderMedAlerts([
      { variant: "error", title: "Noe gikk galt", body: "Prøv igjen senere", service: "sak-api" },
    ]);

    expect(screen.getByText("Noe gikk galt")).toBeInTheDocument();
    expect(screen.getByText("Prøv igjen senere")).toBeInTheDocument();
    expect(screen.getByText("sak-api")).toBeInTheDocument();
  });

  it("viser ingen body når den ikke er satt", () => {
    renderMedAlerts([{ variant: "info", title: "Info uten body" }]);

    expect(screen.getByText("Info uten body")).toBeInTheDocument();
  });

  it("rendrer en alert per oppføring i listen", () => {
    renderMedAlerts([
      { variant: "success", title: "Lagret" },
      { variant: "error", title: "Feilet" },
    ]);

    expect(screen.getByText("Lagret")).toBeInTheDocument();
    expect(screen.getByText("Feilet")).toBeInTheDocument();
  });

  it("kaller removeAlert med riktig indeks når en alert lukkes", () => {
    const removeAlert = vi.fn();
    renderMedAlerts([{ variant: "error", title: "Feilet" }], removeAlert);

    const lukkKnapp = screen.getByRole("button");
    fireEvent.click(lukkKnapp);

    expect(removeAlert).toHaveBeenCalledWith(0);
  });
});
