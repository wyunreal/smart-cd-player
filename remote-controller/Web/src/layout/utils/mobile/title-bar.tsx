import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import useTheme from '@mui/material/styles/useTheme';
import { useContext } from 'react';
import { TitleContext } from 'layout/utils/page-title-context';
import useMediaQuery from '@mui/material/useMediaQuery';
import TitleActions from 'layout/utils/title-actions';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import getModuleTitle from 'module/title';

const TitleBar = ({ showAvatar = false }: { showAvatar?: boolean }) => {
    const theme = useTheme();
    const titleContext = useContext(TitleContext);
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
    const closeButton = titleContext.closeButtonHandler ? (
        <IconButton
            edge="start"
            color="inherit"
            onClick={titleContext.closeButtonHandler}
            aria-label="close"
        >
            <CloseIcon />
        </IconButton>
    ) : null;
    const backButton = titleContext.backButtonHandler ? (
        <IconButton
            edge="start"
            color="inherit"
            onClick={titleContext.backButtonHandler}
            aria-label="close"
        >
            <ArrowBackIosIcon sx={{ marginLeft: '4px', marginRight: '-4px' }} />
        </IconButton>
    ) : null;

    return (
        <AppBar
            position="sticky"
            sx={{
                borderBottom: `1px solid ${theme.palette.text.secondary + 10}`,
            }}
        >
            <Toolbar sx={{ height: 56 }}>
                {(closeButton || backButton) && (
                    <div style={{ marginBottom: '2px', marginRight: '10px' }}>
                        {closeButton}
                        {backButton}
                    </div>
                )}
                <Typography
                    variant="h6"
                    component="div"
                    color="inherit"
                    sx={{
                        flexGrow: 1,
                        marginBottom: isSmallScreen ? 0 : '2px',
                    }}
                >
                    {titleContext.title ?? getModuleTitle()}
                </Typography>
                <TitleActions withDarkBackground showAvatar={showAvatar} />
            </Toolbar>
        </AppBar>
    );
};

export default TitleBar;
