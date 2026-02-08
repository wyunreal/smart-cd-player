const debounce = (callback: any, delay: number) => {
    let waitingExecution = false;
    return (...args: any[]) => {
        if (!waitingExecution) {
            waitingExecution = true;
            setTimeout(() => {
                callback(...args);
                waitingExecution = false;
            }, delay);
        }
    };
};

export default debounce;
