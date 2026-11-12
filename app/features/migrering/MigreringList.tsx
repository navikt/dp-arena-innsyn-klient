import {type ActionFunctionArgs, Link, type LoaderFunctionArgs, Outlet, useLoaderData, useParams} from "react-router";
import invariant from "tiny-invariant";
import {BodyShort, Button, Heading, HGrid, HStack, LinkCard, Page, Tag, VStack} from "@navikt/ds-react";
import {ChevronLeftDoubleIcon, ChevronRightDoubleIcon, MigrationIcon} from "@navikt/aksel-icons";
import {useState} from "react";
import {AnimatePresence, motion} from "motion/react";
import {handleActions} from "~/features/handle-actions";
import {hentMigreringer} from "~/features/migrering/clients/migrering-client.server";
import {formaterTilNorskDato} from "~/utils/dato.utils";


export async function action({request, params}: ActionFunctionArgs) {
    return await handleActions(request, params);
}

export async function loader({params, request}: LoaderFunctionArgs) {
    invariant(params.sakId, "Mangler sak id")
    const sakId = params.sakId;
    const migreringer = await hentMigreringer(request, sakId)
    return {
        migreringer,
        sakId

    }

}

export default function MigreringList() {
    const {migreringer, sakId} = useLoaderData<typeof loader>()
    const [erLukket, setErLukket] = useState(false);
    const params = useParams()
    return (
        <>
            <div className="relative">

                <AnimatePresence initial={false}>
                    {!erLukket && (
                        <motion.div
                            initial={{width: 0, opacity: 0}}
                            animate={{width: 450, opacity: 1}}
                            exit={{width: 0, opacity: 0}}
                            transition={{duration: 0.2, ease: "easeInOut"}}
                        >
                            <aside className={"flex flex-col gap-4"}>
                                <div className={"card flex flex-col gap-4 p-4"}>

                                    <Heading size={"small"}>Migreringer ({migreringer.length})</Heading>
                                    {migreringer.length === 0 && (
                                        <BodyShort size={"small"}>Ingen migreringer funnet for denne saken</BodyShort>
                                    )}
                                    <ul className={"flex flex-col gap-4"}>
                                        {migreringer.map((migrering) => (
                                            <li key={migrering.migreringId}>
                                                <LinkCard
                                                    data-color={migrering.migreringId === params.migreringId ? "accent" : "neutral"}
                                                >
                                                    <LinkCard.Icon>
                                                        <MigrationIcon title="a11y-title"
                                                                       fontSize="1.5rem"/>
                                                    </LinkCard.Icon>
                                                    <LinkCard.Title>

                                                        <VStack gap={"space-12"}>
                                                            <HStack gap={"space-12"} align={"center"}>
                                                                <LinkCard.Anchor asChild>
                                                                    <Link
                                                                        to={`/saker/${migrering.sakId}/migreringer/${migrering.migreringId}`}>
                                                                        {formaterTilNorskDato(migrering.opprettetTidspunkt, true)}
                                                                    </Link>
                                                                </LinkCard.Anchor>
                                                                {migrering.simulering &&
                                                                    <Tag
                                                                        // key={sak.sakId}
                                                                        size={"small"}
                                                                        variant={"moderate"}
                                                                        data-color={"warning"}
                                                                        className={"whitespace-nowrap"}
                                                                    >
                                                                        Simulering
                                                                    </Tag>
                                                                }
                                                            </HStack>
                                                            <Tag
                                                                // key={sak.sakId}
                                                                size={"small"}
                                                                variant={"moderate"}
                                                                data-color={migrering.status?.endsWith("AVBRUTT") ? "danger" : "success"}
                                                                className={"whitespace-nowrap"}
                                                            >
                                                                {migrering.status}
                                                            </Tag>
                                                        </VStack>
                                                    </LinkCard.Title>
                                                    <LinkCard.Description>
                                                        <HGrid columns={2}>

                                                            {/*<FieldValue label={"SaksId"} value={sak.sakId || "-"}/>*/}
                                                            {/*<FieldValue label={"Registrert dato"}
                                                                        value={sak.registrertDato ? norsktDatoformat(sak.registrertDato) : "-"}/>*/}
                                                        </HGrid>
                                                    </LinkCard.Description>

                                                </LinkCard>
                                            </li>
                                        ))}
                                    </ul>

                                </div>
                            </aside>
                        </motion.div>
                    )}
                </AnimatePresence>

                <motion.div
                    className="absolute top-4"
                    initial={false}
                    animate={{
                        right: erLukket ? -12 : -6,
                    }}
                    transition={{duration: 0.2, ease: "easeInOut"}}
                >
                    <Button
                        size={"xsmall"}
                        variant={"primary"}
                        icon={erLukket ? <ChevronRightDoubleIcon title="Pil høyre"/> :
                            <ChevronLeftDoubleIcon title="Pil venstre"/>}
                        onClick={() => setErLukket(!erLukket)}
                        aria-label={erLukket ? "Åpne saksliste" : "Lukk saksliste"}
                    />
                </motion.div>
            </div>
            <Page.Block as={"main"} className={"flex flex-1 flex-col gap-4 h-fit"}>
                <Outlet/>
            </Page.Block>

        </>
    );
}