import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';

// material-ui
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CardActions from '@mui/material/CardActions';
import Chip from '@mui/material/Chip';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Divider from '@mui/material/Divider';
import Grow from '@mui/material/Grow';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import IconButton from '@mui/material/IconButton';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';

// third-party
import PerfectScrollbar from 'react-perfect-scrollbar';

// project imports
import BaseCard from 'component/building-blocks/cards/base-card';

// notification status options
const status = [
    {
        value: 'all',
        label: 'All Notification',
    },
    {
        value: 'new',
        label: 'New',
    },
    {
        value: 'unread',
        label: 'Unread',
    },
    {
        value: 'other',
        label: 'Other',
    },
];

const NotificationSection = () => {
    const theme = useTheme();
    const matchesXs = useMediaQuery(theme.breakpoints.down('md'));

    const [open, setOpen] = useState(false);
    const [value, setValue] = useState('');
    /**
     * anchorRef is used on different componets and specifying one type leads to other components throwing an error
     * */
    const anchorRef = useRef(null);

    const handleToggle = () => {
        setOpen((prevOpen) => !prevOpen);
    };

    const handleClose = (event) => {
        if (anchorRef.current && anchorRef.current.contains(event.target)) {
            return;
        }
        setOpen(false);
    };

    const prevOpen = useRef(open);
    useEffect(() => {
        if (prevOpen.current === true && open === false) {
            anchorRef.current.focus();
        }
        prevOpen.current = open;
    }, [open]);

    const handleChange = (event) => {
        if (event?.target.value) setValue(event?.target.value);
    };

    return (
        <>
            <Box
                sx={{
                    ml: 2,
                }}
            >
                <IconButton
                    color="primary"
                    onClick={handleToggle}
                    ref={anchorRef}
                >
                    <NotificationsNoneOutlinedIcon />
                </IconButton>
            </Box>
            <Popper
                placement={matchesXs ? 'bottom' : 'bottom-end'}
                open={open}
                anchorEl={anchorRef.current}
                role={undefined}
                transition
                disablePortal
                popperOptions={{
                    modifiers: [
                        {
                            name: 'offset',
                        },
                    ],
                }}
            >
                {({ TransitionProps }) => (
                    <Grow
                        position={matchesXs ? 'top' : 'top-right'}
                        in={open}
                        style={{ transformOrigin: 'top right' }}
                        {...TransitionProps}
                    >
                        <Paper>
                            <ClickAwayListener onClickAway={handleClose}>
                                <BaseCard withElevation>
                                    <Grid
                                        container
                                        direction="column"
                                        spacing={2}
                                    >
                                        <Grid item xs={12}>
                                            <Grid
                                                container
                                                alignItems="center"
                                                justifyContent="space-between"
                                                sx={{ pt: 2, px: 2 }}
                                            >
                                                <Grid item>
                                                    <Stack
                                                        direction="row"
                                                        spacing={2}
                                                    >
                                                        <Typography variant="subtitle1">
                                                            All Notification
                                                        </Typography>
                                                        <Chip
                                                            size="small"
                                                            label="01"
                                                            sx={{
                                                                color: theme
                                                                    .palette
                                                                    .background
                                                                    .default,
                                                                bgcolor:
                                                                    theme
                                                                        .palette
                                                                        .warning
                                                                        .dark,
                                                            }}
                                                        />
                                                    </Stack>
                                                </Grid>
                                                <Grid item>
                                                    <Typography
                                                        component={Link}
                                                        to="#"
                                                        variant="subtitle2"
                                                        color="primary"
                                                    >
                                                        Mark as all read
                                                    </Typography>
                                                </Grid>
                                            </Grid>
                                        </Grid>
                                        <Grid item xs={12}>
                                            <PerfectScrollbar
                                                style={{
                                                    height: '100%',
                                                    maxHeight:
                                                        'calc(100vh - 205px)',
                                                    overflowX: 'hidden',
                                                }}
                                            >
                                                <Grid
                                                    container
                                                    direction="column"
                                                    spacing={2}
                                                >
                                                    <Grid item xs={12}>
                                                        <Box
                                                            sx={{
                                                                px: 2,
                                                                pt: 0.25,
                                                            }}
                                                        >
                                                            <TextField
                                                                id="outlined-select-currency-native"
                                                                select
                                                                fullWidth
                                                                value={value}
                                                                onChange={
                                                                    handleChange
                                                                }
                                                                SelectProps={{
                                                                    native: true,
                                                                }}
                                                            >
                                                                {status.map(
                                                                    (
                                                                        option,
                                                                    ) => (
                                                                        <option
                                                                            key={
                                                                                option.value
                                                                            }
                                                                            value={
                                                                                option.value
                                                                            }
                                                                        >
                                                                            {
                                                                                option.label
                                                                            }
                                                                        </option>
                                                                    ),
                                                                )}
                                                            </TextField>
                                                        </Box>
                                                    </Grid>
                                                    <Grid item xs={12} p={0}>
                                                        <Divider
                                                            sx={{ my: 0 }}
                                                        />
                                                    </Grid>
                                                </Grid>
                                            </PerfectScrollbar>
                                        </Grid>
                                    </Grid>
                                    <Divider />
                                    <CardActions
                                        sx={{
                                            p: 1.25,
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <Button size="small" disableElevation>
                                            View All
                                        </Button>
                                    </CardActions>
                                </BaseCard>
                            </ClickAwayListener>
                        </Paper>
                    </Grow>
                )}
            </Popper>
        </>
    );
};

export default NotificationSection;
