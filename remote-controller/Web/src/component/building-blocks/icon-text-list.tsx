import MainIcon from 'component/building-blocks/main-icon';
import IconText from 'component/building-blocks/icon-text';
import { SvgIconComponent } from '@mui/icons-material';
import { SxProps } from '@mui/system';
import { Box, Theme, useMediaQuery } from '@mui/material';
import useTheme from '@mui/material/styles/useTheme';
import BaseCard from './cards/base-card';

const IconTextList = ({
    title,
    Icon,
    instructions,
}: {
    title: string;
    Icon: SvgIconComponent;
    instructions: {
        Icon: React.FunctionComponent<{
            color?:
                | 'inherit'
                | 'action'
                | 'disabled'
                | 'primary'
                | 'secondary'
                | 'error'
                | 'info'
                | 'success'
                | 'warning';
            sx?: SxProps<Theme>;
        }>;
        text: string;
    }[];
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    return (
        <Box sx={{ marginTop: '-16px' }}>
            <BaseCard title={title}>
                {isMobile && <MainIcon Icon={Icon} />}
                <Box>
                    {instructions.map((instruction, index) => (
                        <Box key={index} sx={{ marginBottom: 2 }}>
                            <IconText
                                Icon={instruction.Icon}
                                text={instruction.text}
                            />
                        </Box>
                    ))}
                </Box>
            </BaseCard>
        </Box>
    );
};

export default IconTextList;
