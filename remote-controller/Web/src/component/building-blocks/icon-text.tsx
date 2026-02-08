import { Theme } from '@mui/material';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { SxProps } from '@mui/system';
import React from 'react';
import useTheme from '@mui/material/styles/useTheme';

type IconProps = {
    Icon: React.FunctionComponent<{
        color?:
            | 'inherit'
            | 'action'
            | 'disabled'
            | 'primary'
            | 'secondary'
            | 'error'
            | 'info'
            | 'success'
            | 'warning';
        sx?: SxProps<Theme>;
    }>;
};

type TextProps = IconProps & {
    text: string;
};

type ContentProps = IconProps & {
    content: React.ReactNode;
    vertical?: boolean;
};

const isTextProps = (props: TextProps | ContentProps): props is TextProps => {
    return (props as TextProps).text !== undefined;
};

const IconText = (props: TextProps | ContentProps) => {
    const theme = useTheme();
    const Icon = props.Icon;
    return isTextProps(props) ? (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'center',
            }}
        >
            <Box
                sx={{
                    width: '32px',
                    flexGrow: 0,
                    flexShrink: 0,
                    marginTop: '-1px',
                    marginBottom: '1px',
                }}
            >
                <Icon
                    color={theme.palette.mode === 'dark' ? 'inherit' : 'info'}
                />
            </Box>
            <Box sx={{ flexGrow: 1 }}>
                <Typography>{props.text}</Typography>
            </Box>
        </Box>
    ) : (
        <Box
            sx={{
                display: 'flex',
                flexDirection: props.vertical ? 'column' : 'row',
                justifyContent: 'center',
            }}
        >
            <Box
                sx={{
                    width: props.vertical ? '100%' : '80px',
                    marginBottom: props.vertical ? 2 : 0,
                    flexGrow: 0,
                    flexShrink: 0,
                }}
            >
                <Icon
                    color="disabled"
                    sx={{
                        minWidth: '64px',
                        minHeight: '64px',
                    }}
                />
            </Box>
            <Box sx={{ flexGrow: 1 }}>{props.content}</Box>
        </Box>
    );
};

export default IconText;
