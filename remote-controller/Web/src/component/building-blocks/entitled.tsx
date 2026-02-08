import React, { forwardRef } from 'react';
import { Box } from '@mui/system';
import Typography from '@mui/material/Typography';

type EntitledProps = {
    title?: React.ReactNode;
    growHeight?: boolean;
    reducedMargin?: boolean;
    children: React.ReactNode;
};

const Entitled: React.FC<EntitledProps> = forwardRef(
    ({ title, growHeight = false, reducedMargin = false, children }, ref) => {
        return (
            <Box
                sx={{
                    ...(growHeight
                        ? { minHeight: '100%', height: '100%' }
                        : {}),
                    ...(reducedMargin ? { marginTop: '-20px' } : {}),
                }}
            >
                {title && (
                    <Box sx={{ marginTop: 1, marginBottom: 2 }}>
                        <Typography variant="h6">{title}</Typography>
                    </Box>
                )}
                {children}
            </Box>
        );
    },
);

export default Entitled;
