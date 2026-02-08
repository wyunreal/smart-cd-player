import { EffectCallback, useEffect, useRef } from 'react';

export const useNotRepeatingDelayedEffect = (
    id: number | string,
    delay: number,
    effect: EffectCallback,
) => {
    const called = useRef<number | string | null>(null);
    useEffect(() => {
        let cleanFunction: ReturnType<EffectCallback> = undefined;
        const timeoutHandler = setTimeout(() => {
            if (!called.current || called.current !== id) {
                cleanFunction = effect();
                called.current = id;
            }
        }, delay + 50);

        return () => {
            clearTimeout(timeoutHandler);
            if (cleanFunction) {
                cleanFunction();
            }
        };
    });
};

export const useNotRepeatingEffect = (
    id: number | string,
    effect: EffectCallback,
) => {
    useNotRepeatingDelayedEffect(id, 0, effect);
};
