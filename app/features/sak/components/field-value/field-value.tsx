
import { BodyLong, Detail, VStack } from '@navikt/ds-react';
import styles from './fieldvalue.module.css';
import { EndretMarkering } from "../endret/endret-markering";

type Props = {
  label: string;
  value: string;
  isChanged?: boolean;
};

export function FieldValue({ label, value, isChanged = false }: Props): React.ReactElement {
  return (
    <VStack>
      <Detail className={styles.header}>{label}</Detail>
      <EndretMarkering erEndret={isChanged}>
        <BodyLong size="small">{value}</BodyLong>
      </EndretMarkering>
    </VStack>
  );
}
