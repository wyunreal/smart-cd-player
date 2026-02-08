import { menuItems, SETTINGS_ID } from 'routes';
import DataList from 'component/building-blocks/data-list';
import PageTitle from 'layout/utils/page-title';
import Box from '@mui/material/Box';
import { isNavigationGroup } from 'routes/types';

const Settings = () => {
    const settingsItem = menuItems.filter((item) => item.id === SETTINGS_ID)[0];
    return (
        <PageTitle title={'Settings'}>
            <Box sx={{ marginTop: -1 }}>
                <DataList
                    items={
                        isNavigationGroup(settingsItem)
                            ? settingsItem.children.map((setting) => ({
                                  icon: setting.icon,
                                  title: setting.label,
                                  description: setting.description,
                                  url: setting.url,
                                  withTag: false,
                                  withColoredIcon: true,
                              }))
                            : []
                    }
                />
            </Box>
        </PageTitle>
    );
};

export default Settings;
