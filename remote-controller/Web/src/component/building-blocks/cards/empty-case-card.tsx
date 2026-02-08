import { Box } from '@mui/system';
import BaseCard from './base-card';
import { Typography, useMediaQuery, Zoom } from '@mui/material';
import useTheme from '@mui/material/styles/useTheme';
import { IconType } from 'component/types';
import { Action as ActionType } from 'layout/utils/types';
import Action from '../action';

const EmptyCaseCard = ({
    title,
    Icon,
    content,
    action,
}: {
    title: string;
    Icon: IconType;
    content: string;
    action?: ActionType;
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    return (
        <BaseCard title={title}>
            <Box sx={isMobile ? {} : { display: 'flex', flexDirection: 'row' }}>
                <Zoom in>
                    <Icon
                        color="disabled"
                        sx={{
                            minWidth: '64px',
                            minHeight: '64px',
                            marginRight: 3,
                            [theme.breakpoints.down('sm')]: {
                                minWidth: '100%',
                                marginBottom: 3,
                            },
                        }}
                    />
                </Zoom>
                <Box>
                    <Typography>{content}</Typography>
                    <Box paddingTop={2}>
                        {action && <Action actionParams={action} />}
                    </Box>
                </Box>
            </Box>
        </BaseCard>
    );
};

export default EmptyCaseCard;
