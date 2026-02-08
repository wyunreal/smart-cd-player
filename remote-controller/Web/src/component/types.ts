import { Theme, SxProps } from '@mui/system';

type Content = {
    icon?: React.ReactNode;
    name: string;
    value: string | number;
    type?: 'text' | 'password';
};

export type Category = {
    category: string;
    content: Content[];
};

export type CalibrationPointLabelColors = {
    text: string;
    background: string;
};

export type CalibrationPointLabelColorsGetter = (
    pointValueLabel: string,
) => CalibrationPointLabelColors;

export type IconType = React.FunctionComponent<{
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
