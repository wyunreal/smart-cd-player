import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import Slide from '@mui/material/Slide';
import React, { useEffect, useState } from 'react';
import { TransitionProps } from 'react-transition-group/Transition';
import useTheme from '@mui/material/styles/useTheme';
import TitleBar from 'layout/utils/mobile/title-bar';
import useMediaQuery from '@mui/material/useMediaQuery';
import { DialogContextProvider } from 'layout/utils/dialog-context';

const PADDING = 32;
const TITLE_BAR_HEIGHT = 64;

type FullScreenDialogProps = {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
};

const Transition = React.forwardRef(function Transition(
    props: TransitionProps & {
        children: React.ReactElement;
    },
    ref: React.Ref<unknown>,
) {
    return <Slide direction="up" ref={ref} {...props} />;
});

const ResponsiveDialog = ({
    isOpen,
    onClose,
    children,
}: FullScreenDialogProps) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [height, setHeight] = useState(0);

    const [dialogContentRef, setDialogContentRef] =
        useState<HTMLDivElement | null>(null);

    useEffect(() => {
        const resizeObserver = new ResizeObserver(() => {
            setHeight(dialogContentRef ? dialogContentRef.offsetHeight : 0);
        });
        if (dialogContentRef) {
            resizeObserver.observe(dialogContentRef);
            return () => {
                resizeObserver.disconnect();
            };
        }
    });

    return (
        <DialogContextProvider>
            <Dialog
                fullScreen={isMobile}
                open={isOpen}
                onClose={onClose}
                TransitionComponent={Transition}
                transitionDuration={350}
                sx={{
                    '& .MuiDialog-paper': isMobile
                        ? {}
                        : {
                              width: '600px',
                              backgroundColor: theme.palette.section.background,
                              height: height + TITLE_BAR_HEIGHT + PADDING + 16,
                              transition: 'height 0.5s',
                              overflow: 'hidden',
                          },
                }}
            >
                <TitleBar />

                <Box
                    sx={{
                        padding: isMobile ? '16px' : `${PADDING}px`,
                        minHeight: 'calc(100vh - 57px)',
                        overflowX: 'hidden',
                        backgroundColor: theme.palette.section.background,
                        [theme.breakpoints.up('sm')]: {
                            minHeight: `calc(100vh - ${TITLE_BAR_HEIGHT}px)`,
                        },
                        [theme.breakpoints.up('md')]: {
                            overflow: 'hidden',
                            minHeight: 0,
                        },
                    }}
                >
                    <div
                        style={{ height: 'auto' }}
                        ref={(dialogContentRef) => {
                            setDialogContentRef(dialogContentRef);
                        }}
                    >
                        {children}
                    </div>
                </Box>
            </Dialog>
        </DialogContextProvider>
    );
};

export default ResponsiveDialog;
