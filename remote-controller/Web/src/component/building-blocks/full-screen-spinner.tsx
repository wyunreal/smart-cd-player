import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

const FullScreenSpinner = () => (
    <Box
        sx={{
            minHeight: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        }}
    >
        <CircularProgress />
    </Box>
);

export default FullScreenSpinner;
