import React, { useContext } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Accordion from '../building-blocks/simple-accordeon';
import Box from '@mui/material/Box';
import useTheme from '@mui/material/styles/useTheme';
import CloseIcon from '@mui/icons-material/Close';
import { DialogContext } from 'layout/utils/dialog-context';

export type HelpTopics = {
    [key: string]: {
        sectionId: string;
        title: string;
        description: string;
        content: React.ReactNode;
    };
};

type HelpProps = {
    selectedTopicIndex?: number | null;
    topics: HelpTopics;
};

type HelpDialogProps = HelpProps & {
    isOpen: boolean;
    onClose: () => void;
    insideDialog: boolean;
};

export type SpecificHelpDialogProps = Omit<HelpDialogProps, 'topics'>;

const HelpDialog = ({
    selectedTopicIndex,
    topics,
    isOpen,
    onClose,
    insideDialog,
}: HelpDialogProps) => {
    const theme = useTheme();
    const dialogContext = useContext(DialogContext);

    const forcedSelectedIndex =
        Object.keys(topics).length === 1 ? 0 : undefined;
    const selectedIndex =
        selectedTopicIndex === undefined
            ? forcedSelectedIndex
            : selectedTopicIndex;

    return (
        <Dialog
            open={isOpen}
            onClose={onClose}
            sx={
                dialogContext.insideDialog || insideDialog
                    ? {
                          '& .MuiBackdrop-root': {
                              [theme.breakpoints.up('md')]: {
                                  backgroundColor: 'rgba(0, 0, 0, 0)',
                              },
                          },
                      }
                    : {}
            }
        >
            <DialogTitle>
                <div>
                    <Typography variant="h5">Help</Typography>
                </div>
                <IconButton
                    aria-label="close"
                    onClick={onClose}
                    sx={{
                        position: 'absolute',
                        right: 8,
                        top: 8,
                        color: (theme) => theme.palette.grey[500],
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <Box
                sx={{
                    padding: 2,
                    [theme.breakpoints.up('sm')]: {
                        padding: 3,
                    },
                }}
            >
                <Accordion topics={topics} selectedTopicIndex={selectedIndex} />
            </Box>
        </Dialog>
    );
};

export default HelpDialog;
