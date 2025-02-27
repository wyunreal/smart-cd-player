import {
  Button,
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
  ResultScreen: React.FunctionComponent<{ result: Result }>;
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
        <>
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
        </>
      )}
      {activeStep === steps.length ? (
        <>end of flow</>
      ) : (
        <>
          {ActiveStepContent && (
            <ActiveStepContent data={data} onDataChanged={onDataChanged} />
          )}
          {result && <ResultScreen result={result} />}

          <Button
            disabled={activeStep === 0}
            onClick={() =>
              setActiveStep((prevActiveStep) => prevActiveStep - 1)
            }
          >
            Back
          </Button>

          {activeStep < steps.length - 1 && (
            <Button
              onClick={() =>
                setActiveStep((prevActiveStep) => prevActiveStep + 1)
              }
            >
              "Next"
            </Button>
          )}
          {activeStep === steps.length - 1 && (
            <Button
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
        </>
      )}
    </>
  );
};

export default Flow;
