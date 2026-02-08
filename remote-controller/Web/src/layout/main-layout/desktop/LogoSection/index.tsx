import { Link } from 'react-router-dom';
import Avatar from '@mui/material/Avatar';
import ButtonBase from '@mui/material/ButtonBase';
import SvgIcon from '@mui/material/SvgIcon';
import Typography from '@mui/material/Typography';
import useTheme from '@mui/material/styles/useTheme';
import Fade from '@mui/material/Fade';
import getModuleTitle from 'module/title';

const LogoSection = () => {
    const theme = useTheme();
    return (
        <Fade in={true} timeout={1000}>
            <ButtonBase disableRipple component={Link} to={'/'} sx={{}}>
                <Avatar
                    variant="rounded"
                    sx={{
                        width: '44px',
                        backgroundColor:
                            theme.palette.mode === 'dark'
                                ? theme.palette.primary.main
                                : theme.palette.primary.main,
                    }}
                >
                    <SvgIcon
                        viewBox="1.455 0.824 184.122 73.534"
                        sx={{ width: '40px', height: '28px' }}
                        htmlColor={
                            theme.palette.mode === 'dark'
                                ? theme.palette.section.background
                                : theme.palette.icon.inverse
                        }
                    >
                        <path d="M16.703.854h20.774l-.621 53.4L66.418.854h20.884l-.738 53.4L119.081.866l17.764-.012L95.84 74.336H71.183l.593-55.866-30.934 55.866H15.841L16.703.854Zm120.356 32.58c4.544 0 8.011-.738 10.401-2.214 2.386-1.476 4.059-3.904 5.018-7.284.95-3.348.646-5.744-.912-7.188-1.562-1.444-4.615-2.166-9.158-2.166h-8.871l-11.9 18.852h15.422Zm-23.745 13.173L95.876 74.294l-1.215.042L119.077.864l29.538-.01c11.072 0 18.728 1.624 22.968 4.872 4.239 3.248 5.363 8.382 3.371 15.402-1.377 4.856-3.851 8.844-7.422 11.964-3.57 3.116-8.266 5.412-14.088 6.888 2.797.592 5.073 1.93 6.829 4.014 1.756 2.084 3.234 5.242 4.436 9.474l5.843 20.868h-23.08l-5.067-18.258c-1.02-3.676-2.402-6.186-4.143-7.53-1.736-1.348-4.368-2.022-7.895-2.022l-17.053.081Z" />
                    </SvgIcon>
                </Avatar>
                <Typography
                    variant="h5"
                    sx={{
                        color:
                            theme.palette.mode === 'dark'
                                ? theme.palette.primary.main
                                : theme.palette.primary.main,
                        marginLeft: 1,
                        verticalAlign: 'text-bottom',
                    }}
                >
                    {getModuleTitle()}
                </Typography>
            </ButtonBase>
        </Fade>
    );
};

export default LogoSection;
