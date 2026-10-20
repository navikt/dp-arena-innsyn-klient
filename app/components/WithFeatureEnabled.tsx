import type {ReactNode} from "react";

type Props = {
    enabled: boolean;
    children: ReactNode;
};

export default function WithFeatureEnabled({enabled, children}: Props) {
    return enabled ? <>{children}</> : null;
}