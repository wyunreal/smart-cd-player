import { Theme } from '@mui/material';

const getComponentsOverrides = (theme: Theme) => {
    const selectedColor = theme.palette.primary.main;
    return {
        ...theme,
        components: {
            MuiTypography: {
                styleOverrides: {
                    root: {
                        '@-moz-document url-prefix()': {
                            marginTop: '2px',
                            marginBottom: '-2px',
                        },
                    },
                },
            },
            MuiStepIcon: {
                styleOverrides: {
                    root: {
                        '@-moz-document url-prefix()': {
                            marginTop: '-2px',
                            marginBottom: '2px',
                        },
                    },
                },
            },
            MuiStepConnector: {
                styleOverrides: {
                    root: {
                        '@-moz-document url-prefix()': {
                            marginTop: '-1px',
                            marginBottom: '1px',
                        },
                    },
                },
            },
            MuiButton: {
                styleOverrides: {
                    root: {
                        borderRadius: '4px',
                        fontWeight: 600,
                    },
                },
            },
            MuiPaper: {
                defaultProps: {
                    elevation: 0,
                },
                styleOverrides: {
                    root: {
                        backgroundImage: 'none',
                    },
                    rounded: {
                        borderRadius: '8px',
                    },
                },
            },
            MuiListItemButton: {
                styleOverrides: {
                    root: {
                        alignItems: 'flex-start',
                        backgroundColor: 'inherit',
                        '& .MuiListItemAvatar-root': {
                            minWidth: '48px',
                        },
                        '&.Mui-selected': {
                            backgroundColor:
                                theme.palette.navigation.background,
                            color: selectedColor,
                            '& .MuiListItemIcon-root': {
                                color: selectedColor,
                            },
                            '&:hover': {
                                color: selectedColor,
                                backgroundColor:
                                    theme.palette.navigation.background,
                                [theme.breakpoints.down('md')]: {
                                    backgroundColor: 'inherit',
                                },
                            },
                        },
                        '&:hover': {
                            backgroundColor:
                                theme.palette.navigation.background,
                            [theme.breakpoints.down('md')]: {
                                backgroundColor: 'inherit',
                            },
                        },
                        '&& .MuiTouchRipple-child': {
                            backgroundColor: theme.palette.primary.main,
                        },
                    },
                },
            },
            MuiAvatar: {
                styleOverrides: {
                    root: {
                        color: theme.palette.primary.main,
                        background: theme.palette.primary.light,
                    },
                },
            },
            MuiChip: {
                styleOverrides: {
                    root: {
                        '&.MuiChip-deletable .MuiChip-deleteIcon': {
                            color: 'inherit',
                        },
                    },
                },
            },
            MuiList: {
                styleOverrides: {
                    root: {
                        padding: 0,
                        margin: 0,
                    },
                },
            },
            MuiListItem: {
                styleOverrides: {
                    root: {
                        alignItems: 'center',
                        color: 'inherit',

                        '&.MuiListItem-root .MuiListItemIcon-root': {
                            minWidth: '32px',
                            marginTop: '4px',
                        },
                        '&.MuiListItem-root .MuiListItemAvatar-root': {
                            marginTop: 'auto',
                            marginBottom: 'auto',
                            marginLeft: 0,
                        },
                    },
                },
            },
        },
    };
};

export default getComponentsOverrides;
