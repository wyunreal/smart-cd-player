import NavGroup from './NavGroup';
import { menuItems } from 'routes';
import { isNavigationGroup, isNavigationItem } from 'routes/types';
import NavItem from './NavItem';

const MenuList = () => {
    const navItems = menuItems.map((item) => {
        if (item.platform === 'desktop' || item.platform === 'all') {
            if (isNavigationGroup(item)) {
                return <NavGroup key={item.id} item={item} />;
            }
            if (isNavigationItem(item)) {
                return <NavItem key={item.id} item={item} />;
            }
        }
        return null;
    });

    return <>{navItems}</>;
};

export default MenuList;
