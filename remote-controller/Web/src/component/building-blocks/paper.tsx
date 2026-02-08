import { Paper as MuiPaper } from '@mui/material';
import useTheme from '@mui/material/styles/useTheme';

const Paper = ({
    children,
    sx,
}: {
    children: React.ReactNode;
    sx?: object;
}) => {
    const theme = useTheme();
    return (
        <MuiPaper
            sx={{
                padding: 2,

                border: '1px solid',

                borderColor: theme.palette.primary.dark + 45,
                '@media (prefers-color-scheme: dark)': {
                    borderColor: theme.palette.text.primary + 45,
                },

                [theme.breakpoints.down('md')]: {
                    flexGrow: 1,
                },

                ...sx,
            }}
        >
            {children}
        </MuiPaper>
    );
};

export default Paper;
