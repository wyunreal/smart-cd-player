import { TypographyOptions } from '@mui/material/styles/createTypography';
import { ResponsiveFontSizesOptions } from '@mui/material/styles/responsiveFontSizes';

const fontFamily =
    '-apple-system, BlinkMacSystemFont, avenir next, avenir, segoe ui, helvetica neue, helvetica, Cantarell, Ubuntu, roboto, noto, arial, sans-serif';

type FontOptions = {
    fontWeight?: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
};

const font = (options?: FontOptions) => ({
    fontFamily,
    ...options,
});

const h1 = font({ fontWeight: 300 });
const h2 = font({ fontWeight: 300 });
const h3 = font({ fontWeight: 300 });
const h4 = font({ fontWeight: 300 });
const h5 = font({ fontWeight: 300 });
const h6 = font({ fontWeight: 300 });

const subtitle1 = font();
const subtitle2 = font();

const caption = font();

const body1 = font();
const body2 = font();

export const fontSize: ResponsiveFontSizesOptions = {
    factor: 1.5,
};

export const typography: TypographyOptions = {
    h1,
    h2,
    h3,
    h4,
    h5,
    h6,
    subtitle1,
    subtitle2,
    body1,
    body2,
    caption,
};
