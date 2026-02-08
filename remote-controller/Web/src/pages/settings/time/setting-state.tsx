import ActionCard from 'component/building-blocks/cards/action-card';
import PublicIcon from '@mui/icons-material/Public';

const SettingState = ({
    editHandler,
    isConfigured,
}: {
    editHandler?: () => void;
    isConfigured?: boolean;
}) => {
    const actionHandler = editHandler ? editHandler : () => {};
    return (
        <ActionCard
            title="Local Time"
            Icon={PublicIcon}
            label={
                isConfigured === undefined
                    ? { text: '', color: 'info' }
                    : isConfigured
                    ? { text: 'Configured', color: 'success' }
                    : { text: 'Not Configured', color: 'error' }
            }
            description={
                isConfigured === undefined
                    ? ''
                    : isConfigured
                    ? 'Local time is configured, you can check the configuration using the following button.'
                    : 'Local time is not configured, you must configure it in order to make this module use scheduled events in time.'
            }
            action={{
                action: {
                    caption: 'Configure Local Time',
                    handler: actionHandler,
                },
                type: 'primary',
                shape: 'button',
            }}
        />
    );
};

export default SettingState;
