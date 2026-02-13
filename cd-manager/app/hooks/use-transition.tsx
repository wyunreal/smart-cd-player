import React from "react";

type State = "entering" | "entered" | "exiting" | "exited";
type Direction = "forward" | "backward";
type TransitionStyles = {
  entering?: React.CSSProperties;
  entered?: React.CSSProperties;
  exiting?: React.CSSProperties;
  exited?: React.CSSProperties;
};
type TransitionData = [
  (transitionExecutor: () => void) => void,
  (transitionExecutor: () => void) => void,
  React.CSSProperties,
];

const getTransitionStyles = (
  forwardStyles: TransitionStyles,
  backwardStyles: TransitionStyles | undefined,
  state: State,
  direction: Direction,
): React.CSSProperties => {
  if (direction === "forward" || !backwardStyles) {
    return forwardStyles[state] || {};
  } else {
    return backwardStyles[state] || {};
  }
};

const useTransition = ({
  forwardStyles,
  backwardStyles,
  timeout,
}: {
  forwardStyles: TransitionStyles;
  backwardStyles?: TransitionStyles;
  timeout?: number;
}): TransitionData => {
  const [state, setState] = React.useState<State>("entered");
  const [currentExitId, setCurrentExitId] = React.useState(0);
  const [newEnterId, setNewEnterId] = React.useState(0);
  const [direction, setDirection] = React.useState<Direction>("forward");
  const [initialized, setInitialized] = React.useState(false);

  const transitionStyles = getTransitionStyles(
    forwardStyles,
    backwardStyles,
    state,
    direction,
  );

  React.useEffect(() => {
    if (!initialized) {
      setInitialized(true);
    } else {
      if (currentExitId !== newEnterId) {
        setState("exiting");
        setTimeout(() => {
          setState("exited");
        }, timeout || 250);
      } else {
        setState("entering");
        setTimeout(() => {
          setState("entered");
        }, timeout || 250);
      }
    }
  }, [currentExitId, newEnterId, direction, timeout, initialized]);

  const goForward = (performTransition: () => void) => {
    setDirection("forward");
    setCurrentExitId((s) => s + 1);
    setTimeout(
      () => {
        setNewEnterId((s) => s + 1);
        performTransition();
      },
      (timeout || 250) + 50,
    );
  };

  const goBackward = (performTransition: () => void) => {
    setDirection("backward");
    setCurrentExitId((s) => s - 1);
    setTimeout(
      () => {
        setNewEnterId((s) => s - 1);
        performTransition();
      },
      (timeout || 250) + 50,
    );
  };

  return [goForward, goBackward, transitionStyles];
};

export default useTransition;
