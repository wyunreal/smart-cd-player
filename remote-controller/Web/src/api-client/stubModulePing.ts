const NUMBER_OF_POLLING_REQUESTS = 3;
let pollingCount = 0;

const resolveStubPing = (resolve: (result: boolean) => void) => {
    if (pollingCount++ < NUMBER_OF_POLLING_REQUESTS) {
        resolve(false);
    } else {
        pollingCount = 0;
        resolve(true);
    }
};

export default resolveStubPing;
