import Box from '@mui/material/Box';
import Fade from '@mui/material/Fade';
import Fab from '@mui/material/Fab';
import useTheme from '@mui/material/styles/useTheme';
import useMediaQuery from '@mui/material/useMediaQuery';
import LoadingButton from '@mui/lab/LoadingButton';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

type ButtonData = {
    onClick: () => void;
    startIcon?: React.ReactNode;
    endIcon?: React.ReactNode;
    content: React.ReactNode;
    isDisabled?: boolean;
    isLoading?: boolean;
    isMain?: boolean;
};

type FlowButtonsProps = {
    buttons: ButtonData[];
    message?: string;
    insideDialog?: boolean;
};

const FlowButtons = ({
    buttons,
    message,
    insideDialog = true,
}: FlowButtonsProps) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    return isMobile && insideDialog ? (
        <Box
            sx={
                insideDialog
                    ? { position: 'fixed', bottom: 0, left: 0, right: 0 }
                    : { marginTop: 3 }
            }
        >
            {message && (
                <Box>
                    <Typography
                        variant="h6"
                        sx={{
                            marginTop: 2,
                            marginRight: 2,
                            textAlign: 'right',
                        }}
                    >
                        {message}
                    </Typography>
                </Box>
            )}
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'row-reverse',
                    marginX: 2,
                    gap: 2,
                }}
            >
                {buttons.map(
                    ({ onClick, startIcon, endIcon, content, isMain }, index) =>
                        content ? (
                            <Fade key={index} appear in timeout={500}>
                                <Fab
                                    variant="extended"
                                    size="large"
                                    color={isMain ? 'primary' : 'default'}
                                    sx={{
                                        flexGrow: 0,
                                        flexShrink: 0,
                                        marginBottom: 3,
                                        marginTop: message ? 2 : 3,
                                    }}
                                    onClick={onClick}
                                >
                                    {startIcon}
                                    {content}
                                    {endIcon}
                                </Fab>
                            </Fade>
                        ) : null,
                )}
            </Box>
        </Box>
    ) : (
        <>
            {message && (
                <Box sx={{ marginTop: 2 }}>
                    <Typography
                        variant="h6"
                        sx={{
                            textAlign:
                                !insideDialog || isMobile ? 'left' : 'right',
                        }}
                    >
                        {message}
                    </Typography>
                </Box>
            )}
            <Box
                sx={{
                    display: 'flex',
                    flexDirection:
                        !insideDialog || isMobile ? 'row' : 'row-reverse',
                    pt: 2,
                    gap: 2,
                }}
            >
                {buttons.map(
                    (
                        {
                            onClick,
                            startIcon,
                            endIcon,
                            content,
                            isMain,
                            isDisabled,
                            isLoading,
                        },
                        index,
                    ) =>
                        isLoading === undefined ? (
                            <Button
                                key={index}
                                startIcon={startIcon}
                                endIcon={endIcon}
                                variant={isMain ? 'contained' : 'outlined'}
                                disabled={isDisabled}
                                onClick={onClick}
                            >
                                {content}
                            </Button>
                        ) : (
                            <LoadingButton
                                key={index}
                                startIcon={startIcon}
                                endIcon={endIcon}
                                loading={isLoading}
                                loadingPosition="start"
                                variant={isMain ? 'contained' : 'outlined'}
                                onClick={onClick}
                            >
                                {content}
                            </LoadingButton>
                        ),
                )}
            </Box>
        </>
    );
};

export default FlowButtons;
