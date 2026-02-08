import BaseCard from 'component/building-blocks/cards/base-card';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import useTheme from '@mui/material/styles/useTheme';
import { Action as ActionType } from 'layout/utils/types';
import Action from 'component/building-blocks/action';
import { Skeleton, Zoom } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { IconType } from 'component/types';

type Props = {
    title?: string;
    Icon: IconType;
    label?: { text: string; color: 'error' | 'success' | 'info' };
    description: string;
    extra?: React.ReactNode;
    action?: ActionType;
    fullWidth?: boolean;
};

const ActionCard = ({
    title,
    Icon,
    label,
    description,
    extra,
    action,
    fullWidth = false,
}: Props) => {
    const theme = useTheme();
    const [showTick, setShowTick] = useState(false);
    const [DisplayedIcon, setDisplayedIcon] = useState<IconType>(Icon);

    useEffect(() => {
        setShowTick(false);
        const delayHandler = setTimeout(() => {
            setDisplayedIcon(Icon);
            setShowTick(true);
        }, 250);
        return () => clearTimeout(delayHandler);
    }, [Icon]);

    return (
        <BaseCard title={title}>
            <Box
                sx={{
                    display: 'flex',
                    [theme.breakpoints.up('sm')]: {
                        maxWidth: fullWidth ? 'auto' : '350px',
                    },
                }}
            >
                <Zoom in={showTick}>
                    <DisplayedIcon
                        color="disabled"
                        sx={{
                            minWidth: '64px',
                            minHeight: '64px',

                            marginRight: 2,
                            marginTop: '8px',
                        }}
                    />
                </Zoom>
                <Box>
                    {label && (
                        <Box
                            sx={{
                                color:
                                    label.color === 'success'
                                        ? theme.palette.success.main
                                        : label.color === 'error'
                                        ? theme.palette.error.main
                                        : theme.palette.primary.main,
                                height: '32px',
                            }}
                        >
                            {label.text ? (
                                <Typography variant="overline">
                                    {label.text}
                                </Typography>
                            ) : (
                                <Skeleton
                                    variant="text"
                                    sx={{ fontSize: '1em', width: '100px' }}
                                />
                            )}
                        </Box>
                    )}
                    <Box
                        sx={{
                            [theme.breakpoints.up('md')]: {
                                height: fullWidth ? 'auto' : '50px',
                                width: fullWidth ? 'auto' : '270px',
                            },
                        }}
                    >
                        {description ? (
                            <Typography variant="body2">
                                {description}
                            </Typography>
                        ) : (
                            <Box>
                                <Skeleton
                                    variant="text"
                                    sx={{ fontSize: '1em' }}
                                />
                                <Skeleton
                                    variant="text"
                                    sx={{ fontSize: '1em' }}
                                />
                            </Box>
                        )}
                    </Box>
                    {extra && <Box sx={{ marginTop: 2 }}>{extra}</Box>}
                    <Box
                        sx={{
                            marginTop: 3,
                            alignItems: 'center',
                        }}
                    >
                        {action && <Action actionParams={action} />}
                    </Box>
                </Box>
            </Box>
        </BaseCard>
    );
};

export default ActionCard;
