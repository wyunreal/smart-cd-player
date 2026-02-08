import { ApiContext } from 'api-client';
import { Notification, NotificationsHandler } from 'api-client/types';
import { useContext, useEffect } from 'react';

export type ReadingNotification = Notification;

type NotificationsSubscription = {
    notificationsTypes: string[];
    handler: NotificationsHandler;
};

const observerIdFromTypes = (notificationsTypes: string[]) =>
    notificationsTypes.join('-');

const useNotificationsSubscription = ({
    notificationsTypes,
    handler,
}: NotificationsSubscription) => {
    const { registerNotificationsObserver, unregisterNotificationsObserver } =
        useContext(ApiContext);

    useEffect(() => {
        registerNotificationsObserver(
            observerIdFromTypes(notificationsTypes),
            notificationsTypes,
            handler,
        );

        return () => {
            unregisterNotificationsObserver(
                observerIdFromTypes(notificationsTypes),
            );
        };
    }, [
        notificationsTypes,
        handler,
        registerNotificationsObserver,
        unregisterNotificationsObserver,
    ]);
};

export default useNotificationsSubscription;
