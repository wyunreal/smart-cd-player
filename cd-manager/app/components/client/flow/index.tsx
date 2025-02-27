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
  ResultScreen: React.FunctionComponent<{ result: Result | null }>;
  initialData: StepperData;
  operationName?: string;
  onDataSubmitted: (data: StepperData) => Promise<Result>;
};

const Flow = <StepperData, Result>({
  steps,
  ResultScreen,
  initialData,
  operationName,
  onDataSubmitted,
}: StepperProps<StepperData, Result>) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [activeStep, setActiveStep] = useState(0);
  const [data, setData] = useState(initialData);
  const [result, setResult] = useState<Result | null>(null);

  const ActiveStepContent =
    activeStep < steps.length ? steps[activeStep].content : () => undefined;

  const onDataChanged = (newData: StepperData) => {
    setData(newData);
  };

  return (
    <>
      {isMobile ? (
        <></>
      ) : (
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
      {activeStep === steps.length ? (
        <>end of flow</>
      ) : (
        <>
          <Box marginY={2}>
            <Stack direction="column" spacing={2}>
              <div>
                {ActiveStepContent ? (
                  <ActiveStepContent
                    data={data}
                    onDataChanged={onDataChanged}
                  />
                ) : (
                  <ResultScreen result={result} />
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
                    disabled={activeStep === 0}
                    onClick={() =>
                      setActiveStep((prevActiveStep) => prevActiveStep - 1)
                    }
                  >
                    Back
                  </Button>

                  {activeStep < steps.length - 1 && (
                    <Button
                      variant="contained"
                      onClick={() =>
                        setActiveStep((prevActiveStep) => prevActiveStep + 1)
                      }
                    >
                      Next
                    </Button>
                  )}
                  {activeStep === steps.length - 1 && (
                    <Button
                      variant="contained"
                      onClick={() =>
                        onDataSubmitted(data).then((result) => {
                          setResult(result);
                          setActiveStep((prevActiveStep) => prevActiveStep + 1);
                        })
                      }
                    >
                      {operationName || "Submit"}
                    </Button>
                  )}
                </Stack>
              </div>
            </Stack>
          </Box>
        </>
      )}
    </>
  );
};

export default Flow;
