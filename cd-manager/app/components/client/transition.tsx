import {
  TransitionGroup,
  Transition as ReactTransition,
} from "react-transition-group";
import { ReactNode, useEffect } from "react";
import React from "react";

const TIMEOUT: number = 250;

const getForwardTransitionStyles: any = {
  entering: {
    transition: `opacity ${TIMEOUT}ms ease-in-out, transform ${TIMEOUT}ms ease-in-out`,
    opacity: 1,
    transform: `scale(1) translate3d(0, 0, 0)`,
  },
  entered: {
    transition: `opacity 0ms ease-in-out, transform 0ms ease-in-out`,
    opacity: 1,
    transform: `scale(1) translate3d(0, 0, 0)`,
  },
  exiting: {
    transition: `opacity ${TIMEOUT}ms ease-in-out, transform ${TIMEOUT}ms ease-in-out`,
    opacity: 0,
    transform: "scale(0.95) translate3d(0px, 0, 0px)",
  },
  exited: {
    transition: `opacity 0ms ease-in-out, transform 0ms ease-in-out`,
    opacity: 0,
    transform: "scale(1) translate3d(150px, 0, 0)",
  },
};

const getBackwardTransitionStyles: any = {
  entering: {
    transition: `opacity ${TIMEOUT}ms ease-in-out, transform ${TIMEOUT}ms ease-in-out`,
    opacity: 1,
    transform: `scale(1) translate3d(0, 0, 0)`,
  },
  entered: {
    transition: `opacity 0ms ease-in-out, transform 0ms ease-in-out`,
    opacity: 1,
    transform: `scale(1) translate3d(0, 0, 0)`,
  },
  exiting: {
    transition: `opacity ${TIMEOUT}ms ease-in-out, transform ${TIMEOUT}ms ease-in-out`,
    opacity: 0,
    transform: "scale(0.95) translate3d(0px, 0, 0px)",
  },
  exited: {
    transition: `opacity 0ms ease-in-out, transform 0ms ease-in-out`,
    opacity: 0,
    transform: "scale(1) translate3d(-150px, 0, 0)",
  },
};

const Transition = ({
  currentExitId,
  newEnterId,
  direction,
  children,
}: {
  currentExitId: number;
  newEnterId: number;
  direction: "forward" | "backward";
  children: ReactNode;
}) => {
  const [state, setState] = React.useState<
    "entering" | "entered" | "exiting" | "exited"
  >("entered");
  const [initialized, setInitialized] = React.useState(false);

  console.log("Transition", currentExitId, newEnterId, direction, state);

  useEffect(() => {
    if (!initialized) {
      setInitialized(true);
    } else {
      if (currentExitId !== newEnterId) {
        setState("exiting");
        setTimeout(() => {
          setState("exited");
        }, TIMEOUT);
      } else {
        setState("entering");
        setTimeout(() => {
          setState("entered");
        }, TIMEOUT);
      }
    }
  }, [currentExitId, newEnterId, direction]);

  return (
    <div
      style={{
        ...(direction === "forward"
          ? getForwardTransitionStyles[state]
          : getBackwardTransitionStyles[state]),
      }}
    >
      {children}
    </div>
  );

  /*
  const ref = React.useRef(null);
  return (
    <ReactTransition
      timeout={{
        enter: TIMEOUT,
        exit: TIMEOUT,
      }}
      nodeRef={ref}
      in={newEnterId === currentExitId}
    >
      {(status) => {
        console.log(status);
        return (
          <div
            style={{
              ...getForwardTransitionStyles[status],
            }}
          >
            {children}
          </div>
        );
      }}
    </ReactTransition>
  );*/
};
export default Transition;
