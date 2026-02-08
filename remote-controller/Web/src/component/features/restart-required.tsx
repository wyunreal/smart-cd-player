import DoneIcon from '@mui/icons-material/Done';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import Zoom from '@mui/material/Zoom';
import Box from '@mui/material/Box';
import Fade from '@mui/material/Fade';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import FlowButtons from 'layout/flows/buttons';
import React, { useContext, useEffect, useState } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import { ApiContext } from 'api-client';
import useTheme from '@mui/material/styles/useTheme';
import BaseCard from '../building-blocks/cards/base-card';
import Button from '@mui/material/Button';
import {
    RestartParametersData,
    WIFI_STATE_CONFIGURATION_ACCESS_POINT,
} from 'api-client/methods/restart-parameters';
import { Collapse } from '@mui/material';
import { SvgIconComponent } from '@mui/icons-material';

const restartQuestionMessage = 'Do you want to restart now ?';
const pollingTimeoutCount = 50;

type Props = {
    Icon?: SvgIconComponent;
    title?: string;
    description?: string;
    desktopSpecificDescriptionExtra?: string;
    insideDialog?: boolean;
    handleClose?: () => void;
};

type RestartState = 'initial' | 'requested' | 'timeout' | 'done';

const Container = ({
    show = false,
    title,
    children,
}: {
    show?: boolean;
    title: string;
    children: React.ReactNode;
}) => {
    return show ? (
        <BaseCard title={title}>
            <Box sx={{ display: 'flex', flexDirection: 'row' }}>{children}</Box>
        </BaseCard>
    ) : (
        <>{children}</>
    );
};

const RestartRequired = ({
    Icon,
    title,
    description,
    desktopSpecificDescriptionExtra,
    insideDialog = true,
    handleClose = () => {},
}: Props) => {
    const theme = useTheme();
    const [showTick, setShowTick] = useState(false);
    const [restartState, setRestartState] = useState<RestartState>('initial');
    const [pollingCount, setPollingCount] = useState<number>(0);
    const [restartParameters, setRestartParameters] =
        useState<RestartParametersData | null>(null);

    const apiContext = useContext(ApiContext);

    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    useEffect(() => {
        const delayHandler = setTimeout(() => {
            setShowTick(true);
        }, 250);
        return () => clearTimeout(delayHandler);
    }, []);

    useEffect(() => {
        switch (restartState) {
            case 'initial': {
                if (!restartParameters) {
                    apiContext.api.getRestartParameters().then((parameters) => {
                        setRestartParameters(parameters);
                    });
                }
                break;
            }
            case 'requested': {
                if (restartParameters && pollingCount > 0) {
                    apiContext.api
                        .isModuleAlive(restartParameters.moduleUrl)
                        .then((isAlive) => {
                            if (isAlive) {
                                setRestartState('done');
                            } else if (pollingCount > pollingTimeoutCount) {
                                setRestartState('timeout');
                            }
                        });
                }
                break;
            }
            case 'done': {
                setTimeout(() => {
                    if (restartParameters) {
                        document.location.href = restartParameters.moduleUrl;
                    }
                }, 2000);
                break;
            }
        }
    }, [apiContext, restartState, pollingCount, restartParameters]);

    useEffect(() => {
        if (restartState === 'requested') {
            const pollingHandler = setTimeout(() => {
                setPollingCount(pollingCount + 1);
            }, 3000);
            return () => clearTimeout(pollingHandler);
        }
    }, [pollingCount, restartState]);

    const handleRestart = () => {
        apiContext.api.restartModule();
        setPollingCount(0);
        setRestartState(
            restartParameters?.currentConnectionState ===
                WIFI_STATE_CONFIGURATION_ACCESS_POINT
                ? 'done'
                : 'requested',
        );
    };

    const TheIcon = Icon ?? DoneIcon;

    return (
        <Box>
            <Container
                title={title ? title : 'Module restart is required'}
                show={isMobile}
            >
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'top',
                        marginTop: -2,
                        marginBottom: 2,
                        [theme.breakpoints.down('sm')]: {
                            marginTop: 0,
                            marginBottom: 0,
                            flexDirection: 'column',
                        },
                    }}
                >
                    {restartState === 'initial' && (
                        <>
                            <Container
                                title={
                                    title ? title : 'Module restart is required'
                                }
                                show={!isMobile}
                            >
                                <Zoom in={showTick}>
                                    <TheIcon
                                        color="success"
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
                                    <Typography>
                                        {description
                                            ? description
                                            : 'Settings are now saved, but you need to restart the module for changes to take effect.'}
                                    </Typography>
                                    {!isMobile && (
                                        <Typography sx={{ mt: 2 }}>
                                            {desktopSpecificDescriptionExtra
                                                ? desktopSpecificDescriptionExtra
                                                : 'You can restart now if you need the changes to be applied.'}
                                        </Typography>
                                    )}
                                    {restartParameters?.currentConnectionState ===
                                        WIFI_STATE_CONFIGURATION_ACCESS_POINT && (
                                        <Collapse
                                            appear
                                            in={
                                                restartParameters?.currentConnectionState ===
                                                WIFI_STATE_CONFIGURATION_ACCESS_POINT
                                            }
                                        >
                                            <Box sx={{ mt: 2 }}>
                                                <Typography>
                                                    After restarting, enter the
                                                    following URL in a browser
                                                    to access the module:
                                                </Typography>
                                            </Box>
                                            <Box sx={{ mt: 2 }}>
                                                <Typography>
                                                    <b>
                                                        {
                                                            restartParameters?.moduleUrl
                                                        }
                                                    </b>
                                                </Typography>
                                            </Box>
                                        </Collapse>
                                    )}
                                </Box>
                            </Container>
                        </>
                    )}
                    {restartState === 'requested' && (
                        <Container title="Restarting" show={!isMobile}>
                            <Box
                                sx={{
                                    display: 'flex',
                                    minWidth: '64px',
                                    minHeight: '64px',
                                    marginRight: 3,
                                    [theme.breakpoints.down('sm')]: {
                                        marginRight: 0,
                                        marginBottom: 2,
                                    },
                                }}
                            >
                                <Box sx={{ margin: '12px auto' }}>
                                    <CircularProgress sx={{ margin: 'auto' }} />
                                </Box>
                            </Box>
                            <Box>
                                <Typography>
                                    Restarting module, the page will be
                                    refreshed automatically when restart
                                    finished.
                                </Typography>
                                {!isMobile && (
                                    <Box sx={{ mt: 2 }}>
                                        <Typography>
                                            Please wait while the operation
                                            finishes.
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        </Container>
                    )}
                    {restartState === 'timeout' && (
                        <Container
                            title="Module restart is required"
                            show={!isMobile}
                        >
                            <Zoom in={showTick}>
                                <CloseOutlinedIcon
                                    color="error"
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
                            <Fade in={showTick}>
                                <Box>
                                    <Typography>
                                        Could not confirm the module is
                                        restarted. Please check it manually.
                                    </Typography>

                                    <Button
                                        sx={{ marginLeft: '-8px' }}
                                        href={
                                            restartParameters
                                                ? restartParameters.moduleUrl
                                                : '#'
                                        }
                                    >
                                        Refresh the page
                                    </Button>
                                </Box>
                            </Fade>
                        </Container>
                    )}
                    {restartState === 'done' && (
                        <Container title="Module restarted" show={!isMobile}>
                            <DoneIcon
                                color="success"
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
                            {restartParameters?.currentConnectionState !==
                            WIFI_STATE_CONFIGURATION_ACCESS_POINT ? (
                                <Box>
                                    <Typography>
                                        Module restarted. Redirecting to the new
                                        local url. If the page is not
                                        automatically refreshed, click on the
                                        following button.
                                    </Typography>
                                    <Button
                                        sx={{ marginLeft: '-8px' }}
                                        href={
                                            restartParameters
                                                ? restartParameters.moduleUrl
                                                : '#'
                                        }
                                    >
                                        Refresh the page
                                    </Button>
                                </Box>
                            ) : (
                                <Box>
                                    <Typography>
                                        This screen will be automatically closed
                                        when restart finished, please go to a
                                        browser an enter te following url to
                                        access the module:
                                    </Typography>
                                    <Box sx={{ mt: 2 }}>
                                        <Typography>
                                            <b>{restartParameters.moduleUrl}</b>
                                        </Typography>
                                    </Box>
                                </Box>
                            )}
                        </Container>
                    )}
                </Box>
            </Container>
            {restartState === 'initial' && (
                <FlowButtons
                    insideDialog={insideDialog}
                    message={restartQuestionMessage}
                    buttons={[
                        {
                            content: 'Restart now',
                            onClick: handleRestart,
                            isMain: true,
                        },
                        ...(insideDialog
                            ? [
                                  {
                                      content: 'Later',
                                      onClick: handleClose,
                                  },
                              ]
                            : []),
                    ]}
                />
            )}
            {restartState === 'requested' && (
                <FlowButtons
                    insideDialog={insideDialog}
                    buttons={[
                        {
                            content: 'Cancel',
                            onClick: handleClose,
                        },
                    ]}
                />
            )}
            {restartState === 'timeout' && (
                <FlowButtons
                    insideDialog={insideDialog}
                    buttons={[
                        {
                            content: 'Close',
                            onClick: handleClose,
                        },
                    ]}
                />
            )}
        </Box>
    );
};

export default RestartRequired;
