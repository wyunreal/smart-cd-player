import Badge from '@mui/material/Badge';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Paper from '@mui/material/Paper';
import { isItemSelected, NOTIFICATIONS_ID } from 'routes';
import { Navigation } from 'routes/types';
import { useTheme } from '@mui/material/styles';

import { Link, useLocation } from 'react-router-dom';

type NavigationProps = {
    items: Navigation;
    notificationsBadge: number;
};

const BottomNavigationTabs = ({
    items,
    notificationsBadge,
}: NavigationProps) => {
    const theme = useTheme();
    const location = useLocation();
    return (
        <Paper
            sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }}
            elevation={3}
        >
            <BottomNavigation
                showLabels
                sx={{
                    borderTop: `1px solid ${theme.palette.text.secondary + 10}`,
                }}
            >
                {items.map((item) => {
                    const isTabSelected = isItemSelected(
                        item,
                        location.pathname,
                    );
                    const itemColor = isTabSelected
                        ? theme.palette.primary.main
                        : theme.palette.navigation.main;
                    return (
                        <BottomNavigationAction
                            component={Link}
                            to={item.url}
                            key={item.id}
                            icon={
                                item.id === NOTIFICATIONS_ID &&
                                notificationsBadge > 0 ? (
                                    <Badge badgeContent={2} color="error">
                                        {item.icon}
                                    </Badge>
                                ) : (
                                    item.icon
                                )
                            }
                            value={item.id}
                            label={item.label}
                            sx={{
                                color: itemColor,
                                '> .MuiBottomNavigationAction-label': {
                                    fontSize: '8px',
                                },
                                '> .MuiBottomNavigationAction-label.Mui-selected':
                                    {
                                        fontSize: '8px',
                                    },
                            }}
                        />
                    );
                })}
            </BottomNavigation>
        </Paper>
    );
};

export default BottomNavigationTabs;
