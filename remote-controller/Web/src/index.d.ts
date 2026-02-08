export {};

export type Location = [name: string, left: number, top: number];
type TimeZone = [id: number, text: string, Location[]];
export type TimeZones = {
    [key: string]: [offset: number, timeZone: TimeZone[]];
};

declare global {
    interface Window {
        wreefTimeZones: TimeZones;
    }
}
