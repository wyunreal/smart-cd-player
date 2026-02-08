type MainNavigationOptionId = 'dashboard' | 'notifications' | 'settings';
export type NavigationOptionId =
    | MainNavigationOptionId
    | 'wifi'
    | 'time'
    | 'network-name'
    | 'restart'
    | 'update'
    | 'ir-commands';

type MainNavigationOptionUrl = '/dashboard' | '/notifications' | '/settings';
export type NavigationOptionUrl =
    | MainNavigationOptionUrl
    | '/settings/configure'
    | '/settings/wifi'
    | '/settings/time'
    | '/settings/network-name'
    | '/settings/update'
    | '/settings/restart'
    | '/settings/ir-commands';

type NavigationOptionPlatform = 'mobile' | 'desktop' | 'all';
type NavigationOptionType = 'item' | 'group';

type NavigationOptionBase = {
    id: NavigationOptionId;
    label: string;
    description?: string;
    type: NavigationOptionType;
    platform: NavigationOptionPlatform;
    icon: React.ReactNode;
    url: NavigationOptionUrl;
    disabled?: boolean;
};

export type NavigationOptionItem = NavigationOptionBase & {};

export type NavigationOptionGroup = NavigationOptionBase & {
    children: ReadonlyArray<NavigationOptionGroup | NavigationOptionItem>;
};

export const isNavigationGroup = (
    item: NavigationOptionGroup | NavigationOptionItem,
): item is NavigationOptionGroup => item.type === 'group';

export const isNavigationItem = (
    item: NavigationOptionGroup | NavigationOptionItem,
): item is NavigationOptionItem => item.type === 'item';

export type Navigation = ReadonlyArray<
    NavigationOptionGroup | NavigationOptionItem
>;
