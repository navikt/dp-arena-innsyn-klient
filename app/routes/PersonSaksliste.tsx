import {type ActionFunctionArgs, type LoaderFunctionArgs, Outlet, useLoaderData} from "react-router";
import {handleActions} from "~/server-side-actions/handle-actions";
import {hentSakerForPerson} from "~/models/saksbehandling.server";
import invariant from "tiny-invariant";
import {AnimatePresence, motion} from "motion/react";
import {Button, Heading, HGrid, HStack, LinkCard, Page, Tag} from "@navikt/ds-react";
import {useState} from "react";
import {ChevronLeftDoubleIcon, ChevronRightDoubleIcon} from "@navikt/aksel-icons";
import {FieldValue} from "~/components/field-value/field-value";
import {norsktDatoformat} from "~/utils/dato.utils";
import {PageBlock} from "@navikt/ds-react/Page";

export async function action({request, params}: ActionFunctionArgs) {
    return await handleActions(request, params);
}

export async function loader({params, request}: LoaderFunctionArgs) {
    invariant(params.personId, "Mangler person id")
    const personId = Number(params.personId);
    const saker = await hentSakerForPerson(request, personId)
    console.log("saker", saker)
    return {
        saker,
        personId

    }

}

function sakStatus(status: string | undefined): "accent" | "neutral" | "info" | "success" | "warning" | "danger" | "meta-purple" | "meta-lime" | "brand-beige" | "brand-blue" | "brand-magenta" {
    switch (status) {
        // AKTIV
        // INAKT
        // AVSLU
        case "AKTIV":
            return "success";
        case "INAKT":
            return "warning";
        case "AVSLU":
            return "danger";
        default:
            return "neutral";
    }
}

export default function PersonSaksliste() {
    const {saker, personId} = useLoaderData<typeof loader>()
    const [erLukket, setErLukket] = useState(false);

    return (
        <>
            <div className="relative">

                <AnimatePresence initial={false}>
                    {!erLukket && (
                        <motion.div
                            initial={{width: 0, opacity: 0}}
                            animate={{width: 350, opacity: 1}}
                            exit={{width: 0, opacity: 0}}
                            transition={{duration: 0.2, ease: "easeInOut"}}
                        >
                            <aside className={"flex flex-col gap-4"}>
                                <div className={"card flex flex-col gap-4 p-4"}>
                                    <div className="flex items-center gap-2">
                                        <Heading size={"small"}>Saker ({saker.length})</Heading>
                                    </div>
                                    {saker.map((sak) => (
                                        <LinkCard>
                                            {/*<Box*/}
                                            {/*    asChild*/}
                                            {/*    borderRadius="12"*/}
                                            {/*    padding="space-8"*/}
                                            {/*    style={{ backgroundColor: "var(--ax-bg-moderateA)" }}*/}
                                            {/*>*/}
                                            {/*    <LinkCard.Icon>*/}
                                            {/*        <TasklistIcon fontSize="1.5rem" />*/}
                                            {/*    </LinkCard.Icon>*/}
                                            {/*</Box>*/}
                                            <LinkCard.Title>
                                                <HStack gap={"space-0 space-12"}>
                                                    <LinkCard.Anchor href={`/person/${personId}/saker/${sak.sakId}`}>

                                                        {sak.opprettetAar}-{sak.lopenr}
                                                    </LinkCard.Anchor>
                                                    <Tag
                                                        key={sak.sakId}
                                                        size={"xsmall"}
                                                        variant={"outline"}
                                                        data-color={sakStatus(sak.statuskode)}
                                                        className={"whitespace-nowrap"}
                                                    >
                                                        {sak.statusnavn}
                                                    </Tag>
                                                </HStack>
                                            </LinkCard.Title>
                                            <LinkCard.Description>
                                                <HGrid columns={2}>

                                                    <FieldValue label={"SaksId"} value={sak.sakId || "-"}/>
                                                    <FieldValue label={"Registrert dato"}
                                                                value={sak.registrertDato ? norsktDatoformat(sak.registrertDato) : "-"}/>
                                                </HGrid>
                                            </LinkCard.Description>

                                        </LinkCard>
                                    ))}
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
                        icon={erLukket ? <ChevronRightDoubleIcon/> : <ChevronLeftDoubleIcon/>}
                        onClick={() => setErLukket(!erLukket)}
                        aria-label={erLukket ? "Åpne oppgaveoversikt" : "Lukk oppgaveoversikt"}
                    />
                </motion.div>
            </div>
            <Page.Block as={"main"} className={"card flex flex-1 flex-col gap-4 p-2"}>
                <Outlet/>
            </Page.Block>

        </>

    )
}