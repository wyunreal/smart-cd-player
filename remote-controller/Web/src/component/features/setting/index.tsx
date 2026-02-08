import React, {
    Dispatch,
    SetStateAction,
    useCallback,
    useEffect,
    useState,
} from 'react';
import { CenteredContainer } from 'layout/utils';
import ResponsiveHorizontalLayout from 'layout/sections/responsive-horizontal-layout';
import FullScreenSpinner from 'component/building-blocks/full-screen-spinner';
import HelpDialog, { HelpTopics } from 'component/features/help-dialog';
import {
    ErrorMessages,
    StepperData,
} from 'component/building-blocks/responsive-stepper';
import ModeEditOutlineOutlinedIcon from '@mui/icons-material/ModeEditOutlineOutlined';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import useMediaQuery from '@mui/material/useMediaQuery';
import useTheme from '@mui/material/styles/useTheme';
import { Actions } from 'layout/utils/types';
import Box from '@mui/material/Box';
import Fab from '@mui/material/Fab';
import Fade from '@mui/material/Fade';
import { SetterResponse } from 'api-client/types';
import EditFlow from 'component/building-blocks/flows/editFlow';

const Setting = <T extends StepperData, SaverResponse extends SetterResponse>({
    title,
    api,
    dataCache,
    onBack,
    Current,
    editActionCaption = 'Edit',
    editActionDelegationCondition = () => false,
    editSteps,
    EditSummary,
    EditSuccess,
    helpTopics,
    isEditFlowOpenInitially = false,
    parameters = {},
}: {
    title: string;
    api: {
        getter: () => Promise<T>;
        setter: (settings: T) => Promise<SaverResponse>;
    };
    dataCache: {
        getter: () => T | null;
        setter: (data: T | null) => void;
    };
    onBack: () => void;
    Current: React.FunctionComponent<{
        data: T;
        editHandler?: () => void;
        parameters?: { [key: string]: string };
    }>;
    editActionCaption?: string;
    editActionDelegationCondition?: (data: T) => boolean;
    editSteps: {
        title: string;
        content: React.FunctionComponent<{
            data: T;
            setData: Dispatch<SetStateAction<T>>;
            errors: ErrorMessages;
            onCancelPolicyChanged?: (isClosingAllowed: boolean) => void;
        }>;
        validator: (data: T) => ErrorMessages;
        nextButtonCaption?: string;
        backButtonCaption?: string;
    }[];
    EditSummary: React.FunctionComponent<{
        data: T;
    }>;
    EditSuccess?: React.FunctionComponent<{
        handleClose: () => void;
    }>;
    helpTopics: HelpTopics;
    isEditFlowOpenInitially?: boolean;
    parameters?: { [key: string]: string };
}) => {
    const data = dataCache.getter();
    const [isEditFlowOpen, setIsEditFlowOpen] = useState(
        isEditFlowOpenInitially,
    );
    const [currentHelpTopicIndex, setCurrentHelpTopicIndex] = useState<
        number | undefined
    >(undefined);
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const [editFlowClosingAllowed, setEditFlowClosingAllowed] = useState(true);

    useEffect(() => {
        if (!data) {
            api.getter().then((settings) => {
                dataCache.setter(settings);
            });
        }
    }, [api, data, dataCache]);

    const openHelpOnTopic = (topic: number) => {
        setCurrentHelpTopicIndex(topic);
        setIsHelpOpen(true);
    };

    const onEditFlowClosingPolicyChanged = useCallback(
        (isClosingAllowed: boolean) =>
            setEditFlowClosingAllowed(isClosingAllowed),
        [setEditFlowClosingAllowed],
    );

    const closeEditFlow = () => {
        if (editFlowClosingAllowed) {
            setIsEditFlowOpen(false);
            setCurrentHelpTopicIndex(undefined);
        }
    };

    const theme = useTheme();
    const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

    const editTitleActions: Actions =
        isDesktop && data && !editActionDelegationCondition(data)
            ? [
                  {
                      type: 'primary',
                      action: {
                          caption: editActionCaption,
                          icon: <ModeEditOutlineOutlinedIcon />,
                          handler: () => setIsEditFlowOpen(true),
                      },
                  },
              ]
            : [];

    return (
        <>
            <ResponsiveHorizontalLayout
                title={title}
                titleActions={
                    data
                        ? [
                              ...editTitleActions,
                              {
                                  type: 'secondary',
                                  action: {
                                      caption: 'Get help',
                                      icon: <HelpOutlineOutlinedIcon />,
                                      handler: () => setIsHelpOpen(true),
                                  },
                              },
                          ]
                        : []
                }
                backButtonHandler={onBack}
            >
                {!data && (
                    <CenteredContainer>
                        <FullScreenSpinner />
                    </CenteredContainer>
                )}
                {data && (
                    <Current
                        data={data}
                        editHandler={() => setIsEditFlowOpen(true)}
                        parameters={parameters}
                    />
                )}
            </ResponsiveHorizontalLayout>
            {data && !isDesktop && !editActionDelegationCondition(data) && (
                <Box
                    sx={{
                        position: 'fixed',
                        bottom: 56 + 32,
                        right: 32,
                        display: 'flex',
                        flexDirection: 'row-reverse',
                    }}
                >
                    <Fade
                        appear
                        in
                        timeout={500}
                        style={{ transitionDelay: '250ms' }}
                    >
                        <Fab
                            size="large"
                            color="primary"
                            onClick={() => setIsEditFlowOpen(true)}
                        >
                            <ModeEditOutlineOutlinedIcon />
                        </Fab>
                    </Fade>
                </Box>
            )}
            <HelpDialog
                selectedTopicIndex={currentHelpTopicIndex}
                topics={helpTopics}
                isOpen={isHelpOpen}
                onClose={() => {
                    setIsHelpOpen(false);
                }}
                insideDialog={isEditFlowOpen}
            />
            <EditFlow<T, SaverResponse>
                title={title}
                isOpen={isEditFlowOpen}
                api={api}
                dataCacheSetter={dataCache.setter}
                editSteps={editSteps}
                EditSummary={EditSummary}
                EditSuccess={EditSuccess}
                onOpenHelp={openHelpOnTopic}
                onFlowClosed={closeEditFlow}
                onFlowClosingPolicyChanged={onEditFlowClosingPolicyChanged}
            />
        </>
    );
};

export default Setting;
