import useTheme from '@mui/material/styles/useTheme';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import React, { ForwardedRef, forwardRef } from 'react';
import Entitled from '../entitled';

type BaseCardProps = {
    title?: React.ReactNode;
    children: React.ReactNode;
    withElevation?: boolean;
    growHeight?: boolean;
    growWidth?: boolean;
    sx?: object;
};

const BaseCard: React.FC<BaseCardProps> = forwardRef(
    (
        {
            title,
            children,
            sx = {},
            withElevation = false,
            growHeight = false,
            growWidth = false,
        },
        ref,
    ) => {
        const theme = useTheme();

        return (
            <Entitled title={title} growHeight={growHeight}>
                <Card
                    ref={ref as ForwardedRef<HTMLDivElement>}
                    sx={{
                        border: !withElevation ? '1px solid' : 'none',

                        borderColor: theme.palette.primary.dark + 45,
                        '@media (prefers-color-scheme: dark)': {
                            borderColor: theme.palette.text.primary + 45,
                        },

                        boxShadow: withElevation
                            ? '0 16px 16px 0 rgb(32 40 45 / 60%)'
                            : 'inherit',

                        [theme.breakpoints.down('md')]: {
                            flexGrow: 1,
                        },

                        ...(growHeight ? { minHeight: '100%' } : {}),
                        ...(growWidth ? { minWidth: '100%' } : {}),

                        ...sx,
                    }}
                >
                    <CardContent>{children}</CardContent>
                </Card>
            </Entitled>
        );
    },
);

export default BaseCard;
