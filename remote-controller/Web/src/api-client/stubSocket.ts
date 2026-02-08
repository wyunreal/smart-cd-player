import getStubResponse from './methods-stubs/methods';
import {
    CurryfiedNotificationProcessor,
    getStubNotificationsSource,
    LiteralNotification,
    NotificationStubSource,
} from './methods-stubs/notifications';
import { ApiSocket, InternalMessage, MessageHandlerId } from './types';

let handler: MessageHandlerId | null = null;
let requestId: number | null = null;
let request: InternalMessage | null = null;
let messageHandler: Function | null = null;

let runningNotifications: {
    sourceId: string;
    processor?: CurryfiedNotificationProcessor;
}[] = [];

const notificationsNotCancelled = (sourceId: string) =>
    runningNotifications.find((n) => n.sourceId === sourceId);

const getNotificationMessage = (
    sourceId: string,
    message: LiteralNotification,
) => {
    const processor = runningNotifications.find(
        (n) => n.sourceId === sourceId,
    )?.processor;
    if (processor) {
        return processor(message);
    }
    return message;
};

const createStubSocket: () => ApiSocket = () => {
    setInterval(() => {
        if (
            handler !== null &&
            requestId !== null &&
            messageHandler !== null &&
            request !== null
        ) {
            const response = getStubResponse(handler, requestId, request);
            if (response) {
                const source = getStubNotificationsSource(handler, requestId);
                if (source && source.action === 'start') {
                    runningNotifications.push({
                        sourceId: source.id,
                        processor: (notification) =>
                            source.processor
                                ? source.processor(
                                      JSON.parse(response),
                                      notification,
                                  )
                                : notification,
                    });
                    const notificationsExecutor = (
                        source: NotificationStubSource,
                    ) => {
                        if (source.notifications.length === 0) {
                            return;
                        }
                        const notification = source.notifications[0];
                        source.notifications = source.notifications.slice(1);
                        setTimeout(() => {
                            if (notificationsNotCancelled(source.id)) {
                                const notificationMessage =
                                    getNotificationMessage(
                                        source.id,
                                        notification.message,
                                    );
                                messageHandler?.({
                                    data: JSON.stringify(notificationMessage),
                                });
                                console.log(
                                    'Called message handler with notification: ',
                                    {
                                        data: notificationMessage,
                                    },
                                );
                                notificationsExecutor(source);
                            }
                        }, notification.time);
                    };
                    notificationsExecutor(source);
                }
                if (source && source.action === 'stop') {
                    runningNotifications = runningNotifications.filter(
                        (n) => n.sourceId !== source.id,
                    );
                }

                handler = null;
                messageHandler({ data: response });
            }
        }
    }, 1000);
    return {
        addEventListener: (eventType, handler) => {
            console.log('Called addEventListener using params: ', {
                eventType,
                handler,
            });
            if (eventType === 'message') {
                messageHandler = handler;
            }
        },
        send: (data: string) => {
            const parsedData = JSON.parse(data) as InternalMessage;
            handler = parsedData.handler;
            requestId = parsedData.requestId;
            request = parsedData;
            console.log('Called send using params: ', { data });
        },
    };
};

export default createStubSocket;
