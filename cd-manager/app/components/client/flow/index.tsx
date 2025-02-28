import {
  Box,
  Button,
  Fade,
  Slide,
  Stack,
  Step,
  StepLabel,
  Stepper,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { on } from "events";
import { useState } from "react";

const TRANSITION_DURATION = 300;

type StepProps<StepperData> = {
  data: StepperData;
  onDataChanged: (data: StepperData) => void;
};

type Step<StepperData> = {
  label?: string;
  title: string;
  content: React.FunctionComponent<StepProps<StepperData>>;
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
  const [data, setData] = useState(initialData);
  const [result, setResult] = useState<Result | null>(null);

  const ActiveStepContent =
    activeStep < steps.length ? steps[activeStep].content : undefined;

  const onDataChanged = (newData: StepperData) => {
    setData(newData);
  };

  const [animationId1, setAnimationId1] = useState(0);
  const [animationId2, setAnimationId2] = useState(0);
  const [animationDirection, setAnimationDirection] = useState<
    "next" | "back" | undefined
  >();

  const handleNext = () => {
    setAnimationDirection("next");
    setAnimationId1(activeStep + 1);
    setTimeout(() => {
      setAnimationId2(activeStep + 1);
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }, TRANSITION_DURATION);
  };

  const handleBack = () => {
    setAnimationDirection("back");
    setAnimationId1(activeStep - 1);
    setTimeout(() => {
      setAnimationId2(activeStep - 1);
      setActiveStep((prevActiveStep) => prevActiveStep - 1);
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
            <Fade
              in={animationId1 === animationId2}
              timeout={TRANSITION_DURATION}
            >
              <Box>
                <Slide
                  key={activeStep}
                  direction={
                    animationId1 === animationId2
                      ? animationDirection === "next"
                        ? "left"
                        : "right"
                      : animationDirection === "next"
                        ? "right"
                        : "left"
                  }
                  in={animationId1 === animationId2}
                  easing={"ease-out"}
                  timeout={
                    animationDirection !== undefined ? TRANSITION_DURATION : 0
                  }
                  mountOnEnter
                  unmountOnExit
                >
                  <div>
                    {ActiveStepContent ? (
                      <ActiveStepContent
                        data={data}
                        onDataChanged={onDataChanged}
                      />
                    ) : (
                      ResultScreen && <ResultScreen result={result} />
                    )}
                  </div>
                </Slide>
              </Box>
            </Fade>
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
                  <Button variant="contained" onClick={handleNext}>
                    Next
                  </Button>
                )}
                {activeStep === steps.length - 1 && (
                  <Button
                    variant="contained"
                    onClick={() =>
                      onDataSubmission(data).then((result) => {
                        setResult(result);
                        if (ResultScreen) {
                          handleNext();
                        }
                        if (onResultReception) {
                          onResultReception(result);
                        }
                      })
                    }
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
