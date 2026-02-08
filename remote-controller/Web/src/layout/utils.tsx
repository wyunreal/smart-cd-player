import Grid from '@mui/material/Grid';
import { useTheme } from '@mui/material/styles';

type GridContainerProps = {
    children: React.ReactNode;
    item?: boolean;
};

type GridItemProps = {
    fullWidth?: boolean;
    children: React.ReactNode;
};

type CenteredContainerProps = {
    children: React.ReactNode;
};

export const GridContainer = ({
    children,
    item = false,
}: GridContainerProps) => {
    const itemProps = item ? { item: true } : {};
    return (
        <Grid container {...itemProps} spacing={2}>
            {children}
        </Grid>
    );
};

export const GridItem = ({ fullWidth = false, children }: GridItemProps) => {
    const theme = useTheme();
    return (
        <Grid
            item
            sx={{
                [theme.breakpoints.down('sm')]: {
                    flexGrow: 1,
                },
                flexGrow: fullWidth ? 1 : 0,
            }}
        >
            {children}
        </Grid>
    );
};

export const CenteredContainer = ({ children }: CenteredContainerProps) => (
    <Grid
        container
        spacing={0}
        direction="column"
        alignItems="center"
        justifyContent="center"
    >
        {children}
    </Grid>
);
