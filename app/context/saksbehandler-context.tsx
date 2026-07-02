import { Theme } from "@navikt/ds-react";
import { createContext, type PropsWithChildren, useEffect, useState } from "react";

interface ISaksbehandlerContext {
  aktivtOppgaveSok: string;
  setAktivtOppgaveSok: (sok: string) => void;
  skjulSensitiveOpplysninger: boolean;
  setSkjulSensitiveOpplysninger: (verdi: boolean) => void;
  tema: Tema;
  setTema: (tema: Tema) => void;
}

type Tema = "light" | "dark";

export const SaksbehandlerContext = createContext<ISaksbehandlerContext | undefined>(undefined);

export function SaksbehandlerProvider({ children }: PropsWithChildren) {
  const [aktivtOppgaveSok, setAktivtOppgaveSok] = useState<string>("");
  const [tema, setTema] = useState<Tema>("light");
  const [skjulSensitiveOpplysninger, setSkjulSensitiveOpplysninger] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const lagretTema = localStorage.getItem("tema");
    if (lagretTema) {
      setTema(lagretTema as Tema);
    }
    const lagretSkjulSensitiveOpplysninger = localStorage.getItem("skjul-sensitive-opplysninger");
    if (lagretSkjulSensitiveOpplysninger !== null) {
      setSkjulSensitiveOpplysninger(lagretSkjulSensitiveOpplysninger === "true");
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("tema", tema);
    }
  }, [tema, isMounted]);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem("skjul-sensitive-opplysninger", String(skjulSensitiveOpplysninger));
    }
  }, [skjulSensitiveOpplysninger, isMounted]);

  return (
    <SaksbehandlerContext.Provider
      value={{
        aktivtOppgaveSok,
        setAktivtOppgaveSok,
        skjulSensitiveOpplysninger,
        setSkjulSensitiveOpplysninger,
        tema,
        setTema,
      }}
    >
      <Theme theme={tema} className="main-container">
        {children}
      </Theme>
    </SaksbehandlerContext.Provider>
  );
}
