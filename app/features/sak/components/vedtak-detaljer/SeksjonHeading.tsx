
import { HStack, Label } from '@navikt/ds-react';
import styles from './vedtakdetaljer.module.css';

type Props = {
  tittel: string;
  action?: React.ReactNode;
};

export function SeksjonHeading({ tittel, action }: Props): React.ReactElement {
  return (
    <HStack align="start" gap="space-16" className={styles.seksjonstittel}>
      <Label size="medium">{tittel}</Label>
      {action}
    </HStack>
  );
}
