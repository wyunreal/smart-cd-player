let requestId = 0;

const MAX_REQUEST_ID = 2147483648; // 2^31

const newRequestId = () => {
    requestId++;
    if (requestId >= MAX_REQUEST_ID) {
        requestId = 1;
    }
    return requestId;
};

export default newRequestId;
