import Box from '@mui/material/Box';
import PageTitle from 'layout/utils/page-title';
import useHistoryBack from 'layout/utils/history-back-hook';
import { GridItem } from 'layout/utils';
import {
    Button,
    CircularProgress,
    FormControlLabel,
    Radio,
    RadioGroup,
    TextField,
    Typography,
    Zoom,
    useMediaQuery,
} from '@mui/material';
import { useEffect, useState } from 'react';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import useTheme from '@mui/material/styles/useTheme';
import BaseCard from 'component/building-blocks/cards/base-card';
import DoneIcon from '@mui/icons-material/Done';
import RestartRequired from 'component/features/restart-required';

const Container = ({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    return (
        <BaseCard title={title}>
            <Box sx={isMobile ? {} : { display: 'flex', flexDirection: 'row' }}>
                {children}
            </Box>
        </BaseCard>
    );
};

const STATE_IDLE = 1;
const STATE_RUNNING = 2;
const STATE_SUCCESS = 3;
const STATE_FAIL = 4;

const Update = () => {
    const backHandler = useHistoryBack();
    const [isFileSelected, setIsFileSelected] = useState(false);
    const [error, setError] = useState(false);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [form, setForm] = useState<HTMLFormElement | null>(null);
    const [isFirmware, setIsFirmware] = useState(true);
    const [state, setState] = useState(STATE_IDLE);

    useEffect(() => {
        const submitHandler = (e: any) => {
            e.preventDefault();
            if (form) {
                if (isFileSelected) {
                    const formData = new FormData(form);
                    fetch('/update', {
                        method: 'POST',
                        body: formData,
                    })
                        .then((response) => {
                            setState(
                                response.status === 200
                                    ? STATE_SUCCESS
                                    : STATE_FAIL,
                            );
                            setIsFileSelected(false);
                        })
                        .catch(() => {
                            setState(STATE_FAIL);
                            setIsFileSelected(false);
                        });
                    setState(STATE_RUNNING);
                }
                setError(!isFileSelected);
            }
        };
        form?.addEventListener('submit', submitHandler);

        return () => {
            form?.removeEventListener('submit', submitHandler);
        };
    }, [form, isFileSelected]);

    return (
        <PageTitle title="Settings" backButtonHandler={backHandler}>
            <Box
                sx={{
                    maxWidth: '600px',
                }}
            >
                <GridItem>
                    {(state === STATE_IDLE || state === STATE_FAIL) && (
                        <form
                            action="/update"
                            method="post"
                            encType="multipart/form-data"
                            ref={(ref) => {
                                setForm(ref);
                            }}
                        >
                            <Container title={'Module update'}>
                                <Zoom in>
                                    <ReportProblemIcon
                                        color="warning"
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
                                        You are about to update the module.
                                        Please, be sure that you know what you
                                        are doing. If you flash a wrong firmware
                                        or web interface file, the device will
                                        stop working and you will need to flash
                                        the correct file using a USB cable.
                                    </Typography>
                                </Box>
                            </Container>
                            <Box>
                                <Box>
                                    <Box sx={{ marginTop: 3, marginBottom: 1 }}>
                                        Select the operation you want to
                                        perform.
                                    </Box>
                                    <RadioGroup
                                        aria-labelledby="demo-controlled-radio-buttons-group"
                                        name="controlled-radio-buttons-group"
                                        value={isFirmware ? 'firmware' : 'data'}
                                        onChange={(
                                            event: React.ChangeEvent<HTMLInputElement>,
                                        ) =>
                                            setIsFirmware(
                                                (
                                                    event.target as HTMLInputElement
                                                ).value === 'firmware',
                                            )
                                        }
                                    >
                                        <FormControlLabel
                                            value="firmware"
                                            control={
                                                <Radio
                                                    name="type"
                                                    checked={isFirmware}
                                                />
                                            }
                                            label="Module firmware update"
                                        />
                                        <FormControlLabel
                                            value="data"
                                            control={
                                                <Radio
                                                    name="type"
                                                    checked={!isFirmware}
                                                />
                                            }
                                            label="Data and web interface update"
                                        />
                                    </RadioGroup>
                                    <Box sx={{ marginTop: 2, marginBottom: 2 }}>
                                        {`Select a file with the ${
                                            isFirmware
                                                ? 'firmware'
                                                : 'data and web interface'
                                        } to upgrade the device. Please, be sure you select the correct file.`}
                                    </Box>
                                    <TextField
                                        id="file"
                                        name="file"
                                        type="file"
                                        fullWidth={isMobile}
                                        error={error || state === STATE_FAIL}
                                        helperText={
                                            error
                                                ? 'You need to select a file.'
                                                : state === STATE_FAIL
                                                ? 'The update failed. Please select again a file and try again.'
                                                : null
                                        }
                                        onChange={(e: any) => {
                                            setIsFileSelected(
                                                e.target.files?.length === 1,
                                            );
                                        }}
                                    />
                                </Box>
                                <Button
                                    sx={{ marginTop: 2 }}
                                    variant="contained"
                                    type="submit"
                                >
                                    {`Update ${
                                        isFirmware
                                            ? 'firmware'
                                            : 'data and web interface'
                                    }`}
                                </Button>
                            </Box>
                        </form>
                    )}
                    {state === STATE_RUNNING && (
                        <Container
                            title={`Updating ${
                                isFirmware
                                    ? 'firmware'
                                    : 'data and web interface'
                            }`}
                        >
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
                                    {`The ${
                                        isFirmware
                                            ? 'firmware is'
                                            : 'data and web interface are'
                                    } being updated. Please wait until
                                    the process finishes. It can take a few
                                    minutes.`}
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
                    {state === STATE_SUCCESS && (
                        <RestartRequired
                            Icon={DoneIcon}
                            insideDialog={false}
                            title={`${
                                isFirmware
                                    ? 'Firmware'
                                    : 'Data and web interface'
                            } updated`}
                            description={`The ${
                                isFirmware
                                    ? 'firmware is'
                                    : 'data and web interface are'
                            } now up to date. You can restart the module to apply the changes.`}
                        />
                    )}
                </GridItem>
            </Box>
        </PageTitle>
    );
};

export default Update;
