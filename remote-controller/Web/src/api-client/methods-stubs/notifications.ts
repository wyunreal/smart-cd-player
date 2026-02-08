import { MessageHandlerId, Notification } from 'api-client/types';

export interface LiteralNotification extends Notification {
    [others: string]: any;
}

export type NotificationProcessor = (
    starterMessage: { [key: string]: any },
    notificaiton: LiteralNotification,
) => LiteralNotification;

export type CurryfiedNotificationProcessor = (
    notificaiton: LiteralNotification,
) => LiteralNotification;

type NotificationStub = {
    time: number;
    message: LiteralNotification;
};

export type NotificationStubSource = {
    id: string;
    action: 'start' | 'stop';
    notifications: NotificationStub[];
    processor?: NotificationProcessor;
};

const getStubNotificationsSourceByHandler = (
    handler: MessageHandlerId,
    requestId: number,
): NotificationStubSource | null => {
    switch (handler) {
        case 'startRecordIrCommand':
            return {
                id: 'startRecordIrCommand',
                action: 'start',
                notifications: [
                    {
                        time: 3000,
                        message: {
                            requestId,
                            type: 'irReadSuccess',
                            irType: 'sony',
                            irBits: '1010101010101010',
                            irValue: '1A2B3C4D',
                        },
                    },
                ],
            };
        default:
            return null;
    }
};

export const getStubNotificationsSource = (
    handler: MessageHandlerId,
    requestId: number,
) => {
    const source = getStubNotificationsSourceByHandler(handler, requestId);
    if (source) {
        return source;
    }
    return null;
};
