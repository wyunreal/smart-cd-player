import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';

export const FakeLink = ({ children }: { children: React.ReactNode }) => {
    const theme = useTheme();
    return (
        <Box
            sx={{
                color:
                    theme.palette.mode === 'dark'
                        ? theme.palette.primary.main
                        : theme.palette.primary.dark,
            }}
        >
            {children}
        </Box>
    );
};
