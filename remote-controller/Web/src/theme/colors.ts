import { PaletteColorOptions, TypeBackground, TypeText } from '@mui/material';

const paper = '#ffffff';
const backgroundColor = '#ffffff';
const sectionBackground = '#f5f5f5';

const navigationMain = '#858585';
const navigationSelected = '#1F1F1F';
const navigationBackground = '#EEF7FC';

const primaryLight = '#B8CCF4';
const primaryMain = '#3871E0';
const primaryDark = '#163E8D';

const secondaryLight = '#d1c4e9';
const secondaryMain = '#7c4dff';
const secondaryDark = '#651fff';

const iconInverse = '#ffffff';

const darkPaper = '#0F152E';
const darkBackgroundColor = '#0F152E';
const darkSectionBackground = '#0A0E1F';

const darkNavigationMain = '#7C90DF';
const darkNavigationSelected = '#DEE3F7';
const darkNavigationBackground = '#17213A';

const darkPrimaryLight = '#9BE8CD';
const darkPrimaryMain = '#2AB785';
const darkPrimaryDark = '#22966D';

const darkSecondaryLight = '#651fff';
const darkSecondaryMain = '#7c4dff';
const darkSecondaryDark = '#d1c4e9';

const darkIconInverse = '#CDD5F4';

const darkTextPrimary = '#CDD5F4';
const darkTextSecondary = '#bdc8f0';
const darkTextDisabled = '#bdc8f0';

const darkErrorLight = '#ef9a9a';
const darkErrorMain = '#e57373';
const darkErrorDark = '#ef5350';

const darkSuccessLight = '#9BE8CD';
const darkSuccessMain = '#2AB785';
const darkSuccessDark = '#22966D';

const extraColor1 = '#E28112';
const extraColor2 = '#4891F2';
const extraColor3 = '#EB4D3D';
const extraColor4 = '#349D2F';
const extraColor5 = '#C378E0';

export const primary: PaletteColorOptions = {
    light: primaryLight,
    200: primaryLight,
    main: primaryMain,
    dark: primaryDark,
    800: primaryDark,
};

export const darkPrimary: PaletteColorOptions = {
    light: darkPrimaryLight,
    200: darkPrimaryLight,
    main: darkPrimaryMain,
    dark: darkPrimaryDark,
    800: darkPrimaryDark,
};

export const secondary: PaletteColorOptions = {
    light: secondaryLight,
    200: secondaryLight,
    main: secondaryMain,
    dark: secondaryDark,
    800: secondaryDark,
};

export const darkSecondary: PaletteColorOptions = {
    light: darkSecondaryLight,
    200: darkSecondaryLight,
    main: darkSecondaryMain,
    dark: darkSecondaryDark,
    800: darkSecondaryDark,
};

type IconColorOptions = {
    inverse: string;
};

export const icon: IconColorOptions = {
    inverse: iconInverse,
};

export const darkIcon: IconColorOptions = {
    inverse: darkIconInverse,
};

export const background: Partial<TypeBackground> = {
    default: backgroundColor,
    paper: paper,
};

export const darkBackground: Partial<TypeBackground> = {
    default: darkBackgroundColor,
    paper: darkPaper,
};

export const section = {
    background: sectionBackground,
};

export const darkSection = {
    background: darkSectionBackground,
};

export const navigation = {
    main: navigationMain,
    selected: navigationSelected,
    background: navigationBackground,
};

export const darkNavigation = {
    main: darkNavigationMain,
    selected: darkNavigationSelected,
    background: darkNavigationBackground,
};

export const darkText: Partial<TypeText> = {
    primary: darkTextPrimary,
    secondary: darkTextSecondary,
    disabled: darkTextDisabled,
};

export const darkSuccess: PaletteColorOptions = {
    light: darkSuccessLight,
    main: darkSuccessMain,
    dark: darkSuccessDark,
};

export const darkError: PaletteColorOptions = {
    light: darkErrorLight,
    main: darkErrorMain,
    dark: darkErrorDark,
};

export const extraColors = [
    extraColor1,
    extraColor2,
    extraColor3,
    extraColor4,
    extraColor5,
];
