import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import NavItem from '../NavItem';
import { NavigationOptionGroup } from 'routes/types';

type NavGroupProps = {
    item: NavigationOptionGroup;
};

const NavGroup = ({ item }: NavGroupProps) => {
    const items = item.children.map((menu) => {
        switch (menu.type) {
            case 'item':
                return <NavItem key={menu.id} item={menu} />;
            default:
                return null;
        }
    });

    return (
        <>
            <List
                subheader={
                    <Typography
                        variant="caption"
                        sx={{
                            padding: '6px',
                            textTransform: 'capitalize',
                            marginTop: '10px',
                        }}
                        display="block"
                        gutterBottom
                    >
                        {item.label}
                    </Typography>
                }
            >
                {items}
            </List>

            <Divider sx={{ mt: 0.25, mb: 1.25 }} />
        </>
    );
};

export default NavGroup;
