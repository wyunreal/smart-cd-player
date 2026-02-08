import DataList, { DataListProps } from 'component/building-blocks/data-list';
import useTheme from '@mui/material/styles/useTheme';
import { Box, Typography, useMediaQuery } from '@mui/material';
import Entitled from 'component/building-blocks/entitled';

type ResponsiveDataListProps = DataListProps & {
    title?: string;
};

const ResponsiveDataList = ({ items, title }: ResponsiveDataListProps) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    return isMobile ? (
        <Entitled title={title}>
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    marginTop: -2,
                }}
            >
                <DataList items={items} />
            </Box>
        </Entitled>
    ) : (
        <Entitled title={title}>
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    marginTop: -1,
                }}
            >
                {items.map((item, index) => (
                    <Box
                        key={index}
                        sx={{
                            marginRight: 2,
                            marginBottom: 2,
                            width: 225,
                        }}
                    >
                        <Box sx={{ display: 'flex' }}>
                            <Box sx={{ marginRight: 2 }}>{item.icon}</Box>
                            <Box sx={{ marginTop: '7px' }}>
                                <Typography
                                    variant="body1"
                                    sx={{ display: 'flex' }}
                                >
                                    {item.title}
                                </Typography>

                                {item.rightActionButton && (
                                    <Box
                                        sx={{
                                            marginLeft: '-5px',
                                        }}
                                    >
                                        {item.rightActionButton}
                                    </Box>
                                )}
                                {!item.rightActionButton && (
                                    <Typography
                                        variant="body2"
                                        sx={{ display: 'flex' }}
                                    >
                                        {item.description}
                                    </Typography>
                                )}
                            </Box>
                        </Box>
                    </Box>
                ))}
            </Box>
        </Entitled>
    );
};

export default ResponsiveDataList;
