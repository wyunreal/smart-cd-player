import resolveStubPing from './stubModulePing';

let requestCount = 0;

const getImageUrl = (moduleHost: string) =>
    `${moduleHost}/ping.png?count=${requestCount++}`;

const isModuleAlive = (moduleHost: string): Promise<boolean> =>
    new Promise((resolve) => {
        if (process.env.NODE_ENV === 'production') {
            const image = new Image();
            image.onload = () => {
                resolve(true);
            };
            image.onerror = () => {
                resolve(false);
            };
            image.src = getImageUrl(moduleHost);
        } else {
            return resolveStubPing(resolve);
        }
    });

export default isModuleAlive;
