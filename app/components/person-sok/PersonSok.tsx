import { Search } from "@navikt/ds-react";
import { useForm } from "@rvf/react-router";
import { Form } from "react-router";

import { hentValideringForPersonIdent } from "~/utils/validering.util";

import styles from "./PersokSok.module.css";

export function PersonSok() {
  const sokPersonForm = useForm({
    schema: hentValideringForPersonIdent(),
    method: "post",
    defaultValues: {
      personIdent: "",
    },
  });

  return (
    <Form className={styles.sokForm} {...sokPersonForm.getFormProps()} role="search">
      <input hidden={true} readOnly={true} name="_action" value="sok-person" />
      <Search
        {...sokPersonForm.getInputProps("personIdent")}
        hideLabel={true}
        size="small"
        label="Søk petter person"
        placeholder="Søk etter person"
        variant="secondary"
        clearButton
        onBlur={() => sokPersonForm.clearError("personIdent")}
        error={sokPersonForm.error("personIdent")}
      />
    </Form>
  );
}
