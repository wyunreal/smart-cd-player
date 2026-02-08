import ResponsiveStepper, {
    ErrorMessages,
    StepperData,
} from 'component/building-blocks/responsive-stepper';
import React, { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { CenteredContainer, GridItem } from 'layout/utils';
import Box from '@mui/material/Box';
import FullScreenSpinner from 'component/building-blocks/full-screen-spinner';
import { GridContainer } from 'layout/utils';
import PageTitle from 'layout/utils/page-title';

const EditDialogContent = <T extends StepperData>({
    title,
    dataFetcher,
    onSaveData,
    steps,
    Summary,
    Success,
    onOpenHelp,
    onClose,
    onCancelPolicyChanged,
    confirmationMessage,
    parameters = {},
}: {
    title: string;
    dataFetcher?: () => Promise<T>;
    onSaveData: (settings: T) => Promise<boolean>;
    steps: {
        title: string;
        content: React.FunctionComponent<{
            data: T;
            setData: Dispatch<SetStateAction<T>>;
            errors: ErrorMessages;
            onCancelPolicyChanged?: (isClosingAllowed: boolean) => void;
        }>;
        validator?: (data: T) => ErrorMessages;
        nextButtonCaption?: string;
        backButtonCaption?: string;
    }[];
    Summary?: React.FunctionComponent<{
        data: T;
        parameters: { [key: string]: string };
    }>;
    Success?: React.FunctionComponent<{
        handleClose: () => void;
    }>;
    onOpenHelp: (topicIndex: number) => void;
    onClose: (needUpdate: boolean) => void;
    onCancelPolicyChanged?: (isClosingAllowed: boolean) => void;
    confirmationMessage?: string;
    parameters?: { [key: string]: string };
}) => {
    const [data, setData] = useState<T | null>(null);

    useEffect(() => {
        if (!data && dataFetcher) {
            dataFetcher().then((settings) => {
                setData(settings);
            });
        }
    }, [dataFetcher, data, setData]);

    return data || !dataFetcher ? (
        <GridContainer>
            <GridItem fullWidth={true}>
                <CenteredContainer>
                    <Box
                        sx={{
                            width: '100%',
                        }}
                    >
                        <ResponsiveStepper<T>
                            initialData={data || ({} as T)}
                            steps={steps}
                            Summary={Summary}
                            Success={Success}
                            onSaveData={onSaveData}
                            onClose={onClose}
                            onCancelPolicyChanged={onCancelPolicyChanged}
                            onOpenHelp={onOpenHelp}
                            confirmationMessage={confirmationMessage}
                            parameters={parameters}
                        />
                    </Box>
                </CenteredContainer>
            </GridItem>
        </GridContainer>
    ) : (
        <PageTitle title={title}>
            <CenteredContainer>
                <FullScreenSpinner />
            </CenteredContainer>
        </PageTitle>
    );
};

export default EditDialogContent;
