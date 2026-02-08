import ReconnectingWebSocket from 'reconnecting-websocket';
import { TIMEOUT__ERROR_CODE } from './errorCodes';
import newRequestId from './requestId';
import createStubSocket from './stubSocket';
import {
    ApiSocket,
    InternalMessage,
    Message,
    NotificationsHandler,
    Notification,
} from './types';

const WEBSOCKET_PATH = '/ws';
const REQUEST_TIMEOUT_SECONDS = 10;

type MessageNotificationHandler = (message: InternalMessage) => void;

type Request = {
    message: InternalMessage;
    resolveHandler: MessageNotificationHandler;
    rejectHandler: (code: number) => void;
    timeoutHandler?: ReturnType<typeof setTimeout>;
};

const createSocket: () => ApiSocket = () => {
    if (process.env.NODE_ENV === 'production') {
        return new ReconnectingWebSocket(
            `ws://${window.location.hostname}${WEBSOCKET_PATH}`,
        );
    } else {
        return createStubSocket();
    }
};

const isValidMessage = (message: any): message is InternalMessage =>
    message.requestId > 0;

const isValidNotification = (message: any): message is Notification =>
    !!message.type;

const pendingRequests: Request[] = [];
let currentRequest: Request | null;

const resolveRequest = (parsedMessage: InternalMessage): boolean => {
    if (
        currentRequest &&
        currentRequest.message.requestId === parsedMessage.requestId
    ) {
        currentRequest.resolveHandler &&
            currentRequest.resolveHandler(parsedMessage);
        clearTimeout(currentRequest.timeoutHandler);
        currentRequest = null;
        return true;
    }
    return false;
};

const processRequest = (socket: ApiSocket, request: Request) => {
    socket.send(JSON.stringify(request.message));
    currentRequest = request;
    currentRequest.timeoutHandler = setTimeout(() => {
        currentRequest = null;
        request.rejectHandler(TIMEOUT__ERROR_CODE);
    }, REQUEST_TIMEOUT_SECONDS * 1000);
};

const processNewRequest = (socket: ApiSocket, request: Request) => {
    if (currentRequest) {
        pendingRequests.push(request);
    } else {
        processRequest(socket, request);
    }
};

const connect = () => {
    const socket = createSocket();
    let notificationsHandler: NotificationsHandler = () => {};
    socket.addEventListener('message', (event) => {
        try {
            const parsedMessage = JSON.parse(event.data);
            let requestResolved = false;
            if (isValidMessage(parsedMessage)) {
                requestResolved = resolveRequest(parsedMessage);
            }
            if (!requestResolved && isValidNotification(parsedMessage)) {
                notificationsHandler(parsedMessage);
            }
            if (!currentRequest) {
                const request = pendingRequests.shift();
                request && processRequest(socket, request);
            }
        } catch (e: unknown) {}
    });

    return {
        send: (message: Message): Promise<InternalMessage> => {
            const requestPromise = new Promise((resolve, reject) => {
                processNewRequest(socket, {
                    message: { ...message, requestId: newRequestId() },
                    resolveHandler: resolve,
                    rejectHandler: reject,
                });
            });

            return requestPromise as Promise<InternalMessage>;
        },
        onNotification: (handler: NotificationsHandler) => {
            notificationsHandler = handler;
        },
    };
};

export default connect;
