import { forwardRef, Ref } from 'react';
import { Link } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import { isItemSelected } from 'routes';
import { NavigationOptionItem } from 'routes/types';

type NavItemProps = {
    item: NavigationOptionItem;
};

const NavItem = ({ item }: NavItemProps) => {
    const location = useLocation();

    let listItemProps = {
        component: forwardRef((props, ref: Ref<HTMLAnchorElement>) => (
            <Link ref={ref} {...props} to={item.url} />
        )),
    };

    return (
        <ListItemButton
            {...listItemProps}
            sx={{ marginBottom: 2, paddingY: 2, borderRadius: '8px' }}
            selected={isItemSelected(item, location.pathname)}
        >
            <ListItemIcon
                sx={{
                    my: 'auto',
                    minWidth: !item?.icon ? 18 : 36,
                    marginTop: '3px',
                }}
            >
                {item.icon}
            </ListItemIcon>
            <ListItemText
                primary={
                    <Typography variant={'body1'} color="inherit">
                        {item.label}
                    </Typography>
                }
            />
        </ListItemButton>
    );
};

export default NavItem;
