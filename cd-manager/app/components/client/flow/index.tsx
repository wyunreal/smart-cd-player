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
  initialData: StepperData;
  onDataSubmitted: (data: StepperData) => Promise<Result>;
};

const Flow = <StepperData, Result>({
  steps,
  initialData,
  onDataSubmitted,
}: StepperProps<StepperData, Result>) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [activeStep, setActiveStep] = useState(0);
  const [data, setData] = useState(initialData);

  const ActiveStepContent = steps[activeStep].content;

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
          <ActiveStepContent data={data} onDataChanged={onDataChanged} />

          <Button
            disabled={activeStep === 0}
            onClick={() =>
              setActiveStep((prevActiveStep) => prevActiveStep - 1)
            }
          >
            Back
          </Button>

          <Button
            onClick={() =>
              setActiveStep((prevActiveStep) => prevActiveStep + 1)
            }
          >
            {activeStep === steps.length - 1 ? "Finish" : "Next"}
          </Button>
        </>
      )}
    </>
  );
};

export default Flow;
