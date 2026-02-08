import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import useTheme from '@mui/material/styles/useTheme';
import { TitleContext } from 'layout/utils/page-title-context';
import TitleActions from 'layout/utils/title-actions';
import { useContext } from 'react';

const TitleBar = () => {
    const theme = useTheme();
    const titleContext = useContext(TitleContext);
    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                minHeight: 36,
                [theme.breakpoints.down('md')]: {
                    minHeight: 40,
                },
                marginBottom: 2,
            }}
        >
            <div style={{ flexGrow: 1 }}>
                <Typography variant="h5">
                    {titleContext.title ?? 'Dashboard'}
                </Typography>
            </div>
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                }}
            >
                <TitleActions showAvatar={false} />
            </div>
        </Box>
    );
};

export default TitleBar;
