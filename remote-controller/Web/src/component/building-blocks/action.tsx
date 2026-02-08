import IconButton from '@mui/material/IconButton';
import useTheme from '@mui/material/styles/useTheme';
import {
    Action as ActionType,
    isHandlerAction,
    isRouteAction,
} from 'layout/utils/types';
import { Link } from 'react-router-dom';
import Button from '@mui/material/Button';
import useMediaQuery from '@mui/material/useMediaQuery';

const Action = ({
    actionParams,
    withDarkBackground = false,
    actionKey = 0,
}: {
    actionParams: ActionType;
    withDarkBackground?: boolean;
    actionKey?: any;
}) => {
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
    const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
    const buttonColor = !isDesktop
        ? theme.palette.mode === 'dark' || !withDarkBackground
            ? 'primary'
            : 'inherit'
        : withDarkBackground
        ? 'inherit'
        : 'primary';

    const {
        type,
        shape = 'auto',
        iconPosition = 'left',
        action,
    } = actionParams;

    const buttonVariant =
        !withDarkBackground || isDesktop
            ? type === 'primary'
                ? 'contained'
                : 'outlined'
            : 'outlined';
    if (isHandlerAction(action)) {
        return withDarkBackground ||
            (isSmallScreen && shape === 'auto') ||
            shape === 'icon' ? (
            <IconButton
                key={actionKey}
                onClick={action.handler}
                color={buttonColor}
            >
                {action.icon}
            </IconButton>
        ) : (
            <Button
                key={actionKey}
                color={buttonColor}
                onClick={action.handler}
                variant={buttonVariant}
                {...(iconPosition === 'left'
                    ? { startIcon: action.icon }
                    : { endIcon: action.icon })}
            >
                {action.caption}
            </Button>
        );
    } else if (isRouteAction(action)) {
        return withDarkBackground ||
            (isSmallScreen && shape === 'auto') ||
            shape === 'icon' ? (
            <IconButton
                key={actionKey}
                component={Link}
                color={buttonColor}
                to={action.to}
            >
                {action.icon}
            </IconButton>
        ) : (
            <Button
                key={actionKey}
                component={Link}
                to={action.to}
                color={buttonColor}
                variant={buttonVariant}
                {...(iconPosition === 'left'
                    ? { startIcon: action.icon }
                    : { endIcon: action.icon })}
            >
                {action.caption}
            </Button>
        );
    }
    return null;
};

export default Action;
