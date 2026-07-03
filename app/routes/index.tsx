import {HGrid, InfoCard, Page} from "@navikt/ds-react";

export default function Index() {

    return (
        <Page.Block as={"main"} className={"m-20 w-1/2 justify-self-center h-fit"}>

            <InfoCard data-color="info">
                <InfoCard.Header>
                    <InfoCard.Title>Arena saker</InfoCard.Title>
                </InfoCard.Header>
                <InfoCard.Content>
                    Her kan man se saker i Arena
                </InfoCard.Content>
            </InfoCard>
        </Page.Block>
    )
}