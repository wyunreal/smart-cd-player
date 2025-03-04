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
import Transition from "../transition";

const TRANSITION_DURATION = 300;

export type StepProps<StepperData> = {
  data: StepperData;
  errors: { [key: string]: string } | null;
  onDataChanged: (data: StepperData) => void;
};

type Step<StepperData> = {
  label?: string;
  title: string;
  content: React.FunctionComponent<StepProps<StepperData>>;
  validate?: (data: StepperData) => { [key: string]: string } | null;
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
  const [currentExitId, setCurrentExitId] = useState(0);
  const [data, setData] = useState(initialData);
  const [result, setResult] = useState<Result | null>(null);
  const [validationErrors, setValidationErrors] = useState<{
    [key: string]: string;
  } | null>(null);

  const ActiveStepContent =
    activeStep < steps.length ? steps[activeStep].content : undefined;

  const onDataChanged = (newData: StepperData) => {
    setData(newData);
  };

  const [transitionDirection, setTransitionDirection] = useState<
    "forward" | "backward"
  >("forward");

  const handleNext = () => {
    setTransitionDirection("forward");
    setCurrentExitId((s) => s + 1);
    setTimeout(() => {
      setActiveStep((s) => s + 1);
    }, TRANSITION_DURATION);
  };

  const handleBack = () => {
    setTransitionDirection("backward");
    setCurrentExitId((s) => s - 1);
    setTimeout(() => {
      setActiveStep((s) => s - 1);
    }, TRANSITION_DURATION);
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
            <Transition
              direction={transitionDirection}
              currentExitId={currentExitId}
              newEnterId={activeStep}
            >
              <div>
                {ActiveStepContent ? (
                  <ActiveStepContent
                    data={data}
                    errors={validationErrors}
                    onDataChanged={onDataChanged}
                  />
                ) : (
                  ResultScreen && <ResultScreen result={result} />
                )}
              </div>
            </Transition>
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
                  onClick={handleBack}
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
                        handleNext();
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
                            handleNext();
                          }
                          if (onResultReception) {
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
