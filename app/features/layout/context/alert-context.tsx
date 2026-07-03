import type { AlertProps } from "@navikt/ds-react";
import type { PropsWithChildren } from "react";
import { createContext, useCallback, useState } from "react";

export interface IAlert {
  variant: AlertProps["variant"];
  title: string;
  body?: string;
  service?: string;
}

interface AlertContextType {
  alerts: IAlert[];
  addAlert: (alert: IAlert) => void;
  removeAlert: (index: number) => void;
}

export const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: PropsWithChildren) {
  const [alerts, setAlerts] = useState<IAlert[]>([]);

  const removeAlert = useCallback((index: number) => {
    setAlerts((prevAlerts) => {
      const newAlerts = [...prevAlerts];
      newAlerts.splice(index, 1);
      return newAlerts;
    });
  }, []);

  const addAlert = useCallback((alert: IAlert) => {
    setAlerts((prevAlerts) => [...prevAlerts, alert]);
  }, []);

  return (
    <AlertContext.Provider value={{ alerts, addAlert, removeAlert }}>
      {children}
    </AlertContext.Provider>
  );
}
