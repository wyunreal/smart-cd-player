import React, { Dispatch, SetStateAction } from 'react';
import EditDialogContent from './editDialogContent';
import Flow from 'layout/flows';
import {
    ErrorMessages,
    StepperData,
} from 'component/building-blocks/responsive-stepper';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import { RESPONSE_CODE_SUCCESS, SetterResponse } from 'api-client/types';

const EditFlow = <T extends StepperData, SaverResponse extends SetterResponse>({
    title,
    isOpen,
    api,
    dataCacheSetter,
    editSteps,
    EditSummary,
    EditSuccess,
    onOpenHelp,
    onFlowClosed,
    onFlowClosingPolicyChanged,
    confirmationMessage,
    parameters = {},
}: {
    title: string;
    isOpen: boolean;
    api?: {
        getter: () => Promise<T>;
        setter: (settings: T) => Promise<SaverResponse>;
    };
    dataCacheSetter?: (data: T | null) => void;
    editSteps: {
        title: string;
        content: React.FunctionComponent<{
            data: T;
            setData: Dispatch<SetStateAction<T>>;
            errors: ErrorMessages;
            parameters?: { [key: string]: string };
            onCancelPolicyChanged?: (isClosingAllowed: boolean) => void;
        }>;
        validator?: (data: T) => ErrorMessages;
        nextButtonCaption?: string;
        backButtonCaption?: string;
    }[];
    EditSummary?: React.FunctionComponent<{
        data: T;
        parameters: { [key: string]: string };
    }>;
    EditSuccess?: React.FunctionComponent<{
        handleClose: () => void;
    }>;
    onOpenHelp: (topic: number) => void;
    onFlowClosed: (needUpdate: boolean) => void;
    onFlowClosingPolicyChanged?: (isClosingAllowed: boolean) => void;
    confirmationMessage?: string;
    parameters?: { [key: string]: string };
}) => {
    const [feedbackShown, setFeedbackShown] = React.useState<
        'success' | 'error' | 'none'
    >('none');

    const displayFedback = (type: 'success' | 'error' | 'none') => {
        setFeedbackShown(type);
        setTimeout(() => setFeedbackShown('none'), 3000);
    };

    const handleSaveData = async (data: T): Promise<boolean> => {
        try {
            const response = api
                ? await api.setter(data)
                : await Promise.resolve({ code: RESPONSE_CODE_SUCCESS });
            displayFedback(
                response.code === RESPONSE_CODE_SUCCESS
                    ? !EditSuccess
                        ? 'success'
                        : 'none'
                    : 'error',
            );
            if (response.code === RESPONSE_CODE_SUCCESS) {
                if (!EditSuccess) {
                    onFlowClosed(true);
                }
                dataCacheSetter && dataCacheSetter(null);
            }
            return true;
        } catch (e) {
            displayFedback('error');
            return false;
        }
    };

    const editSuccessFeedback = (
        <Snackbar
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            open={feedbackShown === 'success'}
            onClose={() => {
                setFeedbackShown('none');
            }}
        >
            <Alert
                elevation={6}
                variant="filled"
                severity="success"
                sx={{ width: '100%' }}
                onClose={() => {
                    setFeedbackShown('none');
                }}
            >
                The settings has been saved correctly.
            </Alert>
        </Snackbar>
    );

    const editFailureFeedback = (
        <Snackbar
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            open={feedbackShown === 'error'}
            onClose={() => {
                setFeedbackShown('none');
            }}
        >
            <Alert
                elevation={6}
                variant="filled"
                severity="error"
                sx={{ width: '100%' }}
                onClose={() => {
                    setFeedbackShown('none');
                }}
            >
                Error while saving the settings.
            </Alert>
        </Snackbar>
    );

    return (
        <>
            <Flow isOpen={isOpen} onClose={() => onFlowClosed(false)}>
                <EditDialogContent
                    title={title}
                    dataFetcher={api ? api.getter : undefined}
                    onSaveData={handleSaveData}
                    steps={editSteps}
                    Summary={EditSummary}
                    onOpenHelp={onOpenHelp}
                    onClose={onFlowClosed}
                    Success={EditSuccess}
                    confirmationMessage={confirmationMessage}
                    parameters={parameters}
                    onCancelPolicyChanged={onFlowClosingPolicyChanged}
                />
            </Flow>
            {editSuccessFeedback}
            {editFailureFeedback}
        </>
    );
};

export default EditFlow;
