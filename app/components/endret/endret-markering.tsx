import styles from './endret-markering.module.css';

type Props = {
  children: React.ReactNode;
  erEndret: boolean;
};

export function EndretMarkering({ children, erEndret }: Props): React.ReactElement {
  return <div className={erEndret ? styles.endret : undefined}>{children}</div>;
}
