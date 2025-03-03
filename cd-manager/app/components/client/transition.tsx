import {
  TransitionGroup,
  Transition as ReactTransition,
} from "react-transition-group";
import { ReactNode } from "react";
import React from "react";

type TransitionKind<RC> = {
  children: RC;
  location: string;
};

const TIMEOUT: number = 200;

const getTransitionStyles: any = {
  entering: {
    position: `absolute`,
    opacity: 0,
    transform: `translateX(50px)`,
  },
  entered: {
    transition: `opacity ${TIMEOUT}ms ease-in-out, transform ${TIMEOUT}ms ease-in-out`,
    opacity: 1,
    transform: `translateX(0px)`,
    animation: "blink .3s linear 2",
  },
  exiting: {
    transition: `opacity ${TIMEOUT}ms ease-in-out, transform ${TIMEOUT}ms ease-in-out`,
    opacity: 1,
    transform: `translateX(-50px)`,
  },
  exited: {
    transition: `opacity ${TIMEOUT}ms ease-in-out, transform ${TIMEOUT}ms ease-in-out`,
    opacity: 0,
    transform: `translateX(0px)`,
    animation: "blink .3s linear 2",
  },
};
const Transition = ({
  currentExitId,
  newEnterId,
  children,
}: {
  currentExitId: number;
  newEnterId: number;
  children: ReactNode;
}) => {
  const ref = React.createRef<HTMLElement>();
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
              ...getTransitionStyles[status],
            }}
          >
            {children}
          </div>
        );
      }}
    </ReactTransition>
  );
};
export default Transition;
