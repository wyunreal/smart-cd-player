import React from 'react';

type BaseAction = {
    caption: string;
    icon?: React.ReactNode;
};

export type RouteAction = BaseAction & {
    to: string;
    handler?: undefined;
};

export type HandlerAction = BaseAction & {
    handler: () => void;
    to?: undefined;
};

export type Action = {
    action: RouteAction | HandlerAction;
    type?: 'primary' | 'secondary';
    shape?: 'icon' | 'button' | 'auto';
    iconPosition?: 'left' | 'right';
};

export const isRouteAction = (element: BaseAction): element is RouteAction => {
    return (element as RouteAction).to !== undefined;
};

export const isHandlerAction = (
    element: BaseAction,
): element is HandlerAction => {
    return (element as HandlerAction).handler !== undefined;
};

export type Actions = ReadonlyArray<Action>;
