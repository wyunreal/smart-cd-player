import * as React from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

type Props = {
    initialData?: string;
    isOpen: boolean;
    title: string;
    label: string;
    description?: string;
    fieldType?: string;
    submitButtonText: string;
    onCancel: () => void;
    onSubmit: (data: string) => void;
    error: string;
};

const Prompt = ({
    initialData,
    isOpen,
    title,
    label,
    description,
    fieldType,
    submitButtonText,
    onCancel,
    onSubmit,
    error,
}: Props) => {
    const [data, setData] = React.useState<string>(initialData || '');
    const handleSubmit = () => {
        onSubmit(data);
    };

    React.useEffect(() => {
        if (isOpen) {
            setData(initialData || '');
        }
    }, [initialData, isOpen]);

    const keyPress = (e: any) => {
        if (e.keyCode === 13) {
            handleSubmit();
        }
    };

    return (
        <Dialog open={isOpen} onClose={onCancel}>
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
                {!!description && (
                    <DialogContentText>{description}</DialogContentText>
                )}
                <TextField
                    autoFocus
                    margin="dense"
                    id="data"
                    label={label}
                    type={fieldType ?? 'text'}
                    value={data}
                    fullWidth
                    variant="standard"
                    onChange={(e) => setData(e.target.value)}
                    error={!!error}
                    helperText={error}
                    onKeyDown={keyPress}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={handleSubmit}>{submitButtonText}</Button>
                <Button onClick={onCancel}>Cancel</Button>
            </DialogActions>
        </Dialog>
    );
};

export default Prompt;
