import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import React, { Dispatch, SetStateAction, useCallback } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import useMediaQuery from '@mui/material/useMediaQuery';
import useTheme from '@mui/material/styles/useTheme';
import IconText from './icon-text';
import Fade from '@mui/material/Fade';
import Slide from '@mui/material/Slide';
import PageTitle from 'layout/utils/page-title';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import DoneIcon from '@mui/icons-material/Done';
import CircularProgress from '@mui/material/CircularProgress';
import FlowButtons from 'layout/flows/buttons';
import { Actions } from 'layout/utils/types';

export interface StepperData {}

const defaultConfirmationMessage =
    'Please review and confirm you want to store the data.';

export type ErrorMessages = { [key: string]: string | null };

const empty = (errors: ErrorMessages) => {
    return Object.keys(errors).filter((key) => errors[key] !== null).length > 0;
};

const StepAnimation = ({
    activeStep,
    stepsVisible,
    direction,
    children,
}: {
    activeStep: number;
    stepsVisible: boolean;
    direction: 'left' | 'right';
    children: React.ReactElement;
}) => {
    const theme = useTheme();
    return (
        <Fade key={activeStep} in={stepsVisible} timeout={600} appear>
            <div>
                <Slide
                    direction={direction}
                    key={activeStep}
                    in={stepsVisible}
                    timeout={300}
                    easing={theme.transitions.easing.easeOut}
                    appear
                >
                    {children}
                </Slide>
            </div>
        </Fade>
    );
};

const StepTitle = ({
    enabled,
    title,
    actions,
    closeButtonHandler,
    children,
}: {
    enabled: boolean;
    title?: string;
    actions?: Actions;
    closeButtonHandler?: () => void;
    children: React.ReactNode;
}) =>
    enabled ? (
        <PageTitle
            title={title}
            actions={actions}
            closeButtonHandler={closeButtonHandler}
        >
            {children}
        </PageTitle>
    ) : (
        <>{children}</>
    );

const ResponsiveStepper = <T extends StepperData>({
    steps,
    onStepShown,
    initialData,
    onSaveData,
    onClose,
    onCancelPolicyChanged,
    onOpenHelp,
    Summary,
    Success,
    confirmationMessage,
    parameters = {},
}: {
    steps: {
        title: string;
        content: React.FunctionComponent<{
            data: T;
            setData: Dispatch<SetStateAction<T>>;
            errors: ErrorMessages;
            parameters: { [key: string]: string };
            onCancelPolicyChanged?: (isClosingAllowed: boolean) => void;
            onNextStep?: (validate: boolean) => void;
        }>;
        validator?: (data: T) => ErrorMessages;
        nextButtonCaption?: string;
        backButtonCaption?: string;
    }[];
    onSaveData: (settings: T) => Promise<boolean>;
    onClose: (needUpdate: boolean) => void;
    onCancelPolicyChanged?: (isClosingAllowed: boolean) => void;
    onStepShown?: (stepIndex: number) => void;
    onOpenHelp: (topicIndex: number) => void;
    initialData: T;
    Summary?: React.FunctionComponent<{
        data: T;
        parameters: { [key: string]: string };
    }>;
    Success?: React.FunctionComponent<{ handleClose: () => void }>;
    confirmationMessage?: string;
    parameters?: { [key: string]: string };
}) => {
    const theme = useTheme();

    const [activeStep, setActiveStep] = React.useState(0);
    const [data, setData] = React.useState(initialData);
    const [savingData, setSavingData] = React.useState(false);
    const [errors, setErrors] = React.useState<ErrorMessages>({});
    const [direction, setDirection] = React.useState<'left' | 'right'>('left');
    const [showCustomSuccess, setShowCustomSuccess] = React.useState(false);
    const [flowButtonsVisible, setFlowButtonsVisible] = React.useState(true);

    const handleNext = (validate: boolean) => {
        if (validate) {
            const currentStepValidator =
                steps[activeStep].validator || (() => ({}));
            const errorMessages = (data && currentStepValidator(data)) || {};
            setErrors(errorMessages);
            if (!empty(errorMessages)) {
                setActiveStep(activeStep + 1);
                onStepShown && onStepShown(activeStep + 1);
                setDirection('left');
            }
        } else {
            setActiveStep(activeStep + 1);
            onStepShown && onStepShown(activeStep + 1);
            setDirection('left');
        }
    };

    const handleBack = () => {
        setDirection('right');
        setActiveStep(activeStep - 1);
        onStepShown && onStepShown(activeStep - 1);
    };

    const handleSave = async () => {
        setSavingData(true);
        const success = await onSaveData(data);
        if (success && Success) {
            setShowCustomSuccess(true);
        }
        setSavingData(false);
    };

    const handleCancelPolicyChanged = useCallback(
        (isClosingAllowed: boolean) => {
            setFlowButtonsVisible(isClosingAllowed);
            onCancelPolicyChanged && onCancelPolicyChanged(isClosingAllowed);
        },
        [setFlowButtonsVisible, onCancelPolicyChanged],
    );

    const ContentStep =
        activeStep < steps.length ? steps[activeStep].content : () => null;
    const nextButtonCaption =
        activeStep < steps.length
            ? steps[activeStep].nextButtonCaption !== undefined
                ? steps[activeStep].nextButtonCaption
                : 'Next'
            : null;
    const backButtonCaption =
        activeStep < steps.length
            ? steps[activeStep].backButtonCaption !== undefined
                ? steps[activeStep].backButtonCaption
                : 'Back'
            : 'Back';

    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const getStepTitle = () =>
        activeStep < steps.length ? steps[activeStep].title : 'Confirmation';

    return isMobile ? (
        <StepTitle
            enabled={!showCustomSuccess}
            title={getStepTitle()}
            actions={[
                {
                    type: 'secondary',
                    shape: 'icon',
                    action: {
                        caption: 'Get Help',
                        icon: <HelpOutlineOutlinedIcon />,
                        handler: () => {
                            onOpenHelp(activeStep);
                        },
                    },
                },
            ]}
            closeButtonHandler={() => onClose(false)}
        >
            <div>
                {activeStep === steps.length ? (
                    showCustomSuccess && Success ? (
                        <React.Fragment>
                            <Box sx={{ mt: 2 }}>
                                <Success handleClose={() => onClose(true)} />
                                <Box sx={{ height: '80px' }} />
                            </Box>
                        </React.Fragment>
                    ) : (
                        <React.Fragment>
                            <StepAnimation
                                activeStep={activeStep}
                                stepsVisible
                                direction={direction}
                            >
                                <Box sx={{ mt: 2 }}>
                                    <Box sx={{ marginBottom: 1 }}>
                                        <IconText
                                            Icon={InfoOutlinedIcon}
                                            text={
                                                confirmationMessage ??
                                                defaultConfirmationMessage
                                            }
                                        />
                                    </Box>
                                    {Summary && (
                                        <Summary
                                            data={data}
                                            parameters={parameters}
                                        />
                                    )}
                                    <Box sx={{ height: '80px' }} />
                                </Box>
                            </StepAnimation>
                        </React.Fragment>
                    )
                ) : (
                    <React.Fragment>
                        <StepAnimation
                            activeStep={activeStep}
                            stepsVisible
                            direction={direction}
                        >
                            <Box
                                sx={{
                                    mt: 2,
                                }}
                            >
                                <Grid
                                    container
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="center"
                                >
                                    <Grid
                                        container
                                        spacing={3}
                                        flexDirection={'column'}
                                    >
                                        <ContentStep
                                            data={data}
                                            setData={setData}
                                            errors={errors}
                                            parameters={parameters}
                                            onCancelPolicyChanged={
                                                handleCancelPolicyChanged
                                            }
                                            onNextStep={handleNext}
                                        />
                                        <Box sx={{ height: '80px' }} />
                                    </Grid>
                                </Grid>
                            </Box>
                        </StepAnimation>
                    </React.Fragment>
                )}
            </div>
            {!showCustomSuccess && flowButtonsVisible && (
                <FlowButtons
                    buttons={[
                        {
                            startIcon:
                                activeStep === steps.length &&
                                (savingData ? (
                                    <CircularProgress
                                        color={'inherit'}
                                        size={24}
                                        sx={{ mr: 1 }}
                                    />
                                ) : (
                                    <DoneIcon sx={{ mr: 1 }} />
                                )),
                            content:
                                nextButtonCaption ||
                                activeStep === steps.length ? (
                                    activeStep < steps.length ? (
                                        <Box sx={{ ml: 1 }}>
                                            {nextButtonCaption}
                                        </Box>
                                    ) : (
                                        <Box sx={{ mr: 1 }}>Save Data</Box>
                                    )
                                ) : null,
                            endIcon: activeStep < steps.length && (
                                <ArrowForwardIosIcon
                                    fontSize="small"
                                    sx={{ ml: 1 }}
                                />
                            ),
                            onClick:
                                activeStep < steps.length
                                    ? () => handleNext(true)
                                    : handleSave,
                            isMain: true,
                        },
                        ...(activeStep > 0 && backButtonCaption
                            ? [
                                  {
                                      content: (
                                          <Box sx={{ mx: 1 }}>
                                              {backButtonCaption}
                                          </Box>
                                      ),
                                      onClick: handleBack,
                                  },
                              ]
                            : []),
                    ]}
                />
            )}
        </StepTitle>
    ) : (
        <StepTitle
            enabled={!showCustomSuccess}
            title={getStepTitle()}
            actions={[
                {
                    type: 'secondary',
                    shape: 'icon',
                    action: {
                        caption: 'Get Help',
                        icon: <HelpOutlineOutlinedIcon />,
                        handler: () => {
                            onOpenHelp(activeStep);
                        },
                    },
                },
            ]}
            closeButtonHandler={() => onClose(false)}
        >
            {!showCustomSuccess && steps.length > 1 && (
                <Stepper activeStep={activeStep}>
                    {steps.map(({ title }, index) => {
                        return (
                            <Step
                                key={index}
                                sx={{
                                    paddingLeft: index === 0 ? 0 : 1,
                                    paddingRight:
                                        index === steps.length - 1 ? 0 : 1,
                                }}
                            >
                                <StepLabel>{title}</StepLabel>
                            </Step>
                        );
                    })}
                </Stepper>
            )}
            {activeStep === steps.length ? (
                showCustomSuccess && Success ? (
                    <React.Fragment>
                        <Success handleClose={() => onClose(true)} />
                    </React.Fragment>
                ) : (
                    <React.Fragment>
                        <StepAnimation
                            activeStep={activeStep}
                            stepsVisible
                            direction={direction}
                        >
                            <Box sx={{ mt: steps.length > 1 ? 4 : 0, mb: 2 }}>
                                <Box sx={{ marginBottom: 1 }}>
                                    <IconText
                                        Icon={InfoOutlinedIcon}
                                        text={
                                            confirmationMessage ??
                                            defaultConfirmationMessage
                                        }
                                    />
                                </Box>
                                {Summary && (
                                    <Summary
                                        data={data}
                                        parameters={parameters}
                                    />
                                )}
                            </Box>
                        </StepAnimation>
                        <FlowButtons
                            buttons={[
                                {
                                    isLoading: savingData,
                                    startIcon: <DoneIcon />,
                                    content: savingData
                                        ? 'Saving'
                                        : 'Save settings',
                                    onClick: handleSave,
                                    isMain: true,
                                },
                                {
                                    content: 'Back',
                                    onClick: handleBack,
                                },
                            ]}
                        />
                    </React.Fragment>
                )
            ) : (
                <React.Fragment>
                    <StepAnimation
                        activeStep={activeStep}
                        stepsVisible
                        direction={direction}
                    >
                        <Box
                            sx={{
                                mt: steps.length > 1 ? 4 : 1,
                                mb: 2,
                            }}
                        >
                            <Grid
                                container
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                            >
                                <Grid
                                    container
                                    spacing={3}
                                    flexDirection={'column'}
                                >
                                    <ContentStep
                                        data={data}
                                        setData={setData}
                                        errors={errors}
                                        parameters={parameters}
                                        onCancelPolicyChanged={
                                            handleCancelPolicyChanged
                                        }
                                        onNextStep={handleNext}
                                    />
                                </Grid>
                            </Grid>
                        </Box>
                    </StepAnimation>
                    {flowButtonsVisible && (
                        <FlowButtons
                            buttons={[
                                ...(nextButtonCaption
                                    ? [
                                          {
                                              content: nextButtonCaption,
                                              onClick: () => handleNext(true),
                                              isMain: true,
                                          },
                                      ]
                                    : []),
                                ...(backButtonCaption
                                    ? [
                                          {
                                              content: backButtonCaption,
                                              isDisabled: activeStep === 0,
                                              onClick: handleBack,
                                          },
                                      ]
                                    : []),
                            ]}
                        />
                    )}
                </React.Fragment>
            )}
        </StepTitle>
    );
};

export default ResponsiveStepper;
