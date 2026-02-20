import useTransition from "@/app/hooks/use-transition";
import {
  Box,
  Button,
  Stack,
  Step,
  StepLabel,
  Stepper,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useState } from "react";
import React from "react";

export type StepErrors = { [key: string]: string } | null;

export type StepProps<StepperData> = {
  data: StepperData;
  errors: StepErrors;
  onDataChanged: (data: StepperData) => void;
  clearValidationErrors: () => void;
};

type Step<StepperData> = {
  label?: string;
  title: string;
  content: React.FunctionComponent<StepProps<StepperData>>;
  validate?: (data: StepperData) => StepErrors;
};

type StepperProps<StepperData, Result> = {
  steps: Step<StepperData>[];
  ResultScreen?: React.FunctionComponent<{ result: Result | null }>;
  initialData: StepperData;
  operationName?: string;
  closeActionName?: string;
  onDataSubmission: (data: StepperData) => Promise<Result>;
  onResultReception?: (result: Result) => void;
  onClose: () => void;
};

const TRANSITION_DURATION: number = 250;

const forwardTransitionStyles: { [key: string]: React.CSSProperties } = {
  entering: {
    transition: `${TRANSITION_DURATION}ms ease-in-out`,
    opacity: 1,
    transform: `scale(1) translate3d(0, 0, 0)`,
  },
  entered: {
    transition: `0ms`,
    opacity: 1,
    transform: `scale(1) translate3d(0, 0, 0)`,
  },
  exiting: {
    transition: `${TRANSITION_DURATION}ms ease-in-out`,
    opacity: 0,
    transform: "scale(0.95) translate3d(0px, 0, 0px)",
  },
  exited: {
    transition: `0ms`,
    opacity: 0,
    transform: "scale(1) translate3d(150px, 0, 0)",
  },
};

const backwardTransitionStyles: { [key: string]: React.CSSProperties } = {
  entering: {
    transition: `${TRANSITION_DURATION}ms ease-in-out`,
    opacity: 1,
    transform: `scale(1) translate3d(0, 0, 0)`,
  },
  entered: {
    transition: `0ms`,
    opacity: 1,
    transform: `scale(1) translate3d(0, 0, 0)`,
  },
  exiting: {
    transition: `${TRANSITION_DURATION}ms ease-in-out`,
    opacity: 0,
    transform: "scale(0.95) translate3d(0px, 0, 0px)",
  },
  exited: {
    transition: `0ms`,
    opacity: 0,
    transform: "scale(1) translate3d(-150px, 0, 0)",
  },
};

const Flow = <StepperData, Result>({
  steps,
  ResultScreen,
  initialData,
  operationName,
  closeActionName,
  onDataSubmission,
  onResultReception,
  onClose,
}: StepperProps<StepperData, Result>) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [activeStep, setActiveStep] = useState(0);
  const [data, setData] = useState(initialData);
  const [result, setResult] = useState<Result | null>(null);
  const [validationErrors, setValidationErrors] = useState<{
    [key: string]: string;
  } | null>(null);

  const ActiveStepContent =
    activeStep < steps.length ? steps[activeStep].content : undefined;

  const [goForward, goBackward, transitionStyles] = useTransition({
    forwardStyles: forwardTransitionStyles,
    backwardStyles: backwardTransitionStyles,
    timeout: TRANSITION_DURATION,
  });

  const clearValidationErrors = () => {
    setValidationErrors(null);
  };

  return (
    <>
      {!isMobile && (
        <Box marginTop={2} marginX="-8px">
          <Stepper activeStep={activeStep}>
            {steps.map(({ label, title }, index) => {
              const stepProps: { completed?: boolean } = {};
              return (
                <Step key={index} {...stepProps}>
                  <StepLabel>{label || title}</StepLabel>
                </Step>
              );
            })}
          </Stepper>
        </Box>
      )}
      {
        <Box marginY={2}>
          <Stack direction="column" spacing={2}>
            <div style={transitionStyles}>
              {ActiveStepContent ? (
                <ActiveStepContent
                  data={data}
                  errors={validationErrors}
                  onDataChanged={setData}
                  clearValidationErrors={clearValidationErrors}
                />
              ) : (
                ResultScreen && <ResultScreen result={result} />
              )}
            </div>
            <div>
              <Stack
                direction="row"
                justifyContent={"end"}
                spacing={2}
                marginBottom={1}
              >
                <Button
                  variant="outlined"
                  disabled={activeStep === 0 || activeStep === steps.length}
                  onClick={() =>
                    goBackward(() => {
                      setActiveStep((s) => s - 1);
                    })
                  }
                >
                  Back
                </Button>

                {activeStep < steps.length - 1 && (
                  <Button
                    variant="contained"
                    onClick={() => {
                      const validationErrors =
                        steps[activeStep].validate?.(data) || null;
                      setValidationErrors(validationErrors);
                      if (validationErrors === null) {
                        goForward(() => {
                          setActiveStep((s) => s + 1);
                        });
                      }
                    }}
                  >
                    Next
                  </Button>
                )}
                {activeStep === steps.length - 1 && (
                  <Button
                    variant="contained"
                    onClick={() => {
                      const validationErrors =
                        steps[activeStep].validate?.(data) || null;
                      if (validationErrors === null) {
                        onDataSubmission(data).then((result) => {
                          setResult(result);
                          if (ResultScreen) {
                            goForward(() => {
                              setActiveStep((s) => s + 1);
                              if (onResultReception) {
                                onResultReception(result);
                              }
                            });
                          } else if (onResultReception) {
                            onResultReception(result);
                          }
                        });
                      }
                      setValidationErrors(validationErrors);
                    }}
                  >
                    {operationName || "Submit"}
                  </Button>
                )}
                {activeStep === steps.length && (
                  <Button variant="contained" onClick={onClose}>
                    {closeActionName || "Close"}
                  </Button>
                )}
              </Stack>
            </div>
          </Stack>
        </Box>
      }
    </>
  );
};

export default Flow;
