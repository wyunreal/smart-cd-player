import WifiIcon from '@mui/icons-material/Wifi';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import ActionCard from 'component/building-blocks/cards/action-card';

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
            title="Wifi Connection"
            Icon={
                isConfigured === undefined || isConfigured
                    ? WifiIcon
                    : WifiOffIcon
            }
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
                    ? 'Wifi connection is configured, you can check the configuration using the following button.'
                    : 'Wifi connection is not configured, you must configure it in order to make this module work.'
            }
            action={{
                action: {
                    caption: 'Configure Wifi',
                    handler: actionHandler,
                },
                type: 'primary',
                shape: 'button',
            }}
        />
    );
};

export default SettingState;
