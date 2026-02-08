const weekDays = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
];

export const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const elapsedDays = (Date.now() - timestamp) / 1000 / 60 / 60 / 24;

    const time = `${date.getHours() < 10 ? '0' : ''}${date.getHours()}:${
        date.getMinutes() < 10 ? '0' : ''
    }${date.getMinutes()}`;

    if (elapsedDays < 1) {
        const isSameDay = new Date().getDate() === date.getDate();
        return isSameDay ? `Today at ${time}` : `Yesterday at ${time}`;
    }

    if (elapsedDays < 2) {
        const isSameDay =
            new Date(timestamp - 24 * 60 * 60 * 60 * 1000).getDate() ===
            date.getDate();
        if (isSameDay) return `Yesterday at ${time}`;
    }

    if (elapsedDays < 7) return `${weekDays[date.getDay()]} at ${time}`;

    return `${date.getFullYear()}/${
        date.getMonth() < 10 ? '0' : ''
    }${date.getMonth()}/${date.getDate() < 10 ? '0' : ''}${date.getDate()} ${
        date.getHours() < 10 ? '0' : ''
    }${date.getHours()}:${
        date.getMinutes() < 10 ? '0' : ''
    }${date.getMinutes()}`;
};
