import { useContext } from "react";

import { AlertContext } from "~/context/alert-context";

export function useGlobalAlerts() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error("useGlobalAlerts must be used within an AlertsProvider");
  }
  return context;
}
