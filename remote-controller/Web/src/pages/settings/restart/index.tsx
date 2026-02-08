import Box from '@mui/material/Box';
import PageTitle from 'layout/utils/page-title';
import RestartRequired from 'component/features/restart-required';
import useHistoryBack from 'layout/utils/history-back-hook';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

const Restart = () => {
    const backHandler = useHistoryBack();
    return (
        <PageTitle title="Settings" backButtonHandler={backHandler}>
            <Box
                sx={{
                    maxWidth: '600px',
                }}
            >
                <RestartRequired
                    Icon={RestartAltIcon}
                    insideDialog={false}
                    title="Restart module"
                    description="If you have changed some settings, you will need to restart the module for changes to take effect."
                />
            </Box>
        </PageTitle>
    );
};

export default Restart;
