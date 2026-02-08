import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import SvgIcon from '@mui/material/SvgIcon';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import useTheme from '@mui/material/styles/useTheme';
import Entitled from '../building-blocks/entitled';
import PlaceIcon from '@mui/icons-material/Place';
import { TimeZoneRecord } from 'api-client/timeZones';
import { Location } from 'index';
import { CurrentTime, CurrentTimeData } from 'api-client/methods/time-settings';
import { useEffect, useState } from 'react';

const Clock = ({ time }: { time: CurrentTime }) => {
    const [currentTime, setCurrentTime] = useState({
        hour: time.hour,
        minute: time.minute,
        second: time.second,
    });

    useEffect(() => {
        const handler = setInterval(() => {
            let newSecond = currentTime.second + 1;
            let newMinute = currentTime.minute;
            let newHour = currentTime.hour;
            if (newSecond >= 60) {
                newSecond = 0;
                newMinute++;
                if (newMinute >= 60) {
                    newMinute = 0;
                    newHour++;
                    if (newHour >= 24) {
                        newHour = 0;
                    }
                }
            }
            setCurrentTime({
                hour: newHour,
                minute: newMinute,
                second: newSecond,
            });
        }, 1000);

        return () => clearTimeout(handler);
    }, [currentTime, setCurrentTime]);

    const d = new Date(
        1983,
        9,
        13,
        currentTime.hour,
        currentTime.minute,
        currentTime.second,
    );

    return <>{d.toLocaleTimeString()}</>;
};

type Props = {
    timeZone?: TimeZoneRecord;
    currentTimeData?: CurrentTimeData;
    cityName?: string;
};

const getTimeZonePosition = (timeZoneOffset: number) =>
    (timeZoneOffset / 24) * 100 + 45;

const getTooltipPlacement = (cityLocation: Location) => {
    const [, left, top] = cityLocation;
    if (top < 20) {
        return left < 20 ? 'bottom-end' : left > 80 ? 'bottom-start' : 'bottom';
    } else {
        return left < 20 ? 'top-end' : left > 80 ? 'top-start' : 'top';
    }
};

const TimeZoneMap = ({ timeZone, currentTimeData, cityName }: Props) => {
    const theme = useTheme();
    const timeZoneCity = timeZone?.cities[0] || undefined;
    const [timeZoneCityName, cityLeft, cityTop] = timeZoneCity || [];
    const timeZonePosition = getTimeZonePosition(
        timeZone ? timeZone.offset / 60 / 60 : 0,
    );
    const timeZoneWidth = (1 / 24) * 100 + 5;
    const [tooltipOpen, setTooltipOpen] = useState(false);

    useEffect(() => {
        const handler = setTimeout(() => {
            setTooltipOpen(true);
        }, 500);

        return () => {
            clearTimeout(handler);
        };
    }, [setTooltipOpen]);

    const [mapRef, setMapRef] = useState<HTMLDivElement | null>(null);
    const [mapDimensions, setMapDimensions] = useState<
        { width: number; height: number } | undefined
    >();
    useEffect(() => {
        if (mapRef) {
            const resizeObserver = new ResizeObserver(() => {
                setMapDimensions({
                    width: mapRef.offsetWidth,
                    height: mapRef.offsetHeight,
                });
            });
            resizeObserver.observe(mapRef);
            return () => {
                resizeObserver.disconnect();
            };
        }
    }, [mapRef]);

    return (
        <Entitled title={'Local time'}>
            <Box sx={{ position: 'relative' }}>
                <div
                    ref={(ref) => {
                        setMapRef(ref);
                    }}
                >
                    <SvgIcon
                        sx={{
                            width: '100%',
                            height: 'auto',
                            [theme.breakpoints.up('sm')]: {
                                width: '548px',
                            },
                        }}
                        viewBox="-2794 0 3818 1880"
                        htmlColor={
                            theme.palette.mode === 'dark'
                                ? theme.palette.primary.dark
                                : theme.palette.primary.light
                        }
                    >
                        <path d="m814 679-76 32-19-23 69-32 26 23zm-104 59-59 96-95 49-27-32 95-53 32-93 54 33zm-14 204-31 23-28-87 19 5 40 59zm51 378-191-40-6-68 179 45 18 63zm272 370-67 82-32-4-9-47 83-90-34-51 19-28 32 47 8 91zm-514-488-36 63-31-4 31-72 36 13zm-67-13-38 72-68-18 5-54 59-59 42 59zm586-702-127 14 4 45-76 100-15-91 42-54-146 14-86 45-11 37 61-14 4 86-41 4-13 42-83 55 13 36-53 36-19-63-36 19 9 127-155 90 41 60-68 40-28-53-14 4 14 59 55 36-19 19-36-10 9 28 32 4 18 55 83 31 4 28-95-17-133-146 55 4-78-169v-46h-22l-10 42-76 59v55l-60 17-37-104-26-8 4-61-219-40 36 59 37-13 41 40-41 51-96 36-100-192h-27l-4 37 67 136 51 38 78-6-141 205 17 18 6 68-42 32-5 51-109 132-87-5-77-210 24-32v-54l-65-77 27-18-63-41-127-4-74-65-4-140 164-142 91-8 23 26-5 23 73 23 36-32 28 23 99 5 19-19v-55l-41 55-54-73 9 73-51-37-9-54-61-71-11 12 49 68-32 45-13-54-55-41-31 28-19-10-104 97-37-102 73 5 13-32-27-28 46-36 27-4 51-46-14-36 27-13 18 27 92-5 4-26 100-38-18-22-63 22-19-40 46-36-27-28-59 77 21 18-4 47-59 17-14-36-63 8 4-54 104-140 115-28 172 40-31 47-68-6 45 46 132-87h87l-59-67 68-70 95-40 14 32-90 32-51 54 104 64-17-32 63-55 114 28 17-36 206-78 141 31-104 60 323 33 55-55 26 49 156 14 45 24 127-15v173zM797 1508l-78 145-63-5-123-91-4 23-151 31 18-63-32-13v-78l197-127 90 59 5-50 27-4 114 173zM-807 587l-4 38h-64l20-38-42-45 31-32 19 45 40 32zm-127-172-82 59-49-73 91-23 40 37zm258 394-28-10 17-27 11 37zM-952 82l-54 46-10 114-82 127-131 40-32 78-59-4-68-105-27-141-55-41-60 19-31-42 99-123 410-50 100 82zm65 520-28 31-31-28 26-45 33 42zm605 756-41 131-59-41 17-59 59-46 24 15zm-1294-402-36-18v-32l36 50zm133 87-23 9-114-41 8-23 129 55zm-160-68-9 28-70-15 7-34 72 21zm428 318-36 42-10 82-277 296c10 17 13 37 9 59l-36 36 32 40-28 32-72-81v-132l45-260-60-28-63-158 27-41v-46h-63l-28-55-36 4-128-72-41-50h-50l-137-182 6-91-47-68-31 9-23-46 27 4-68-72-90-14-220 109 78-76-55-42-23-155 91-46 437 46-82-59 19-78 437-167 169 8-150 169 199 163-63 68-119-21 15-74h-42l-18 51 13 44-90-8-47 63 33 27 64 19 59 68 22-68-13-14v-68l141 23 114 137-160 91v49l-28-4-27 27 6 36-65 55 19 60h-32l-27-41h-100l-38 68 38 36h17l36-22 24 13-9 51 36 4 9 55h65l63-27 45 17 85 3 6 56h69l8 65h47l122 81zm-1411-869-137-4-32 13 36 36-75 18V314l185 74 23 36zm191 579-18 32-63-42-42 22-100-59 9-27 114 46 44-23 56 51zm-255-106-50 32-27-59 77 27zm514 588-27 27-41-27 28-28 40 28zm-72-41-32 18-42-28 32-40 42 50zm2050-698-5-37-23 3 3 37 25-3zm-82 59-30-59 25-34-13-14-26 20 6 97 38-10zm-141-61-33-53-31-6 2 24-27 3-23-30-41 51 8 32 36-28h28l81 7z" />
                    </SvgIcon>
                </div>
                {timeZone && (
                    <>
                        <Box
                            sx={{
                                position: 'absolute',
                                top: 0,
                                bottom: 0,
                                left: `${timeZonePosition}%`,
                                width: `${timeZoneWidth}%`,

                                opacity: 0.4,
                                background: `linear-gradient(0deg, ${theme.palette.section.background} 0%, ${theme.palette.text.primary} 40%, ${theme.palette.text.primary} 60%, ${theme.palette.section.background} 100%)`,
                            }}
                        />

                        <Tooltip
                            title={
                                <>
                                    <Typography variant="body1">
                                        {timeZoneCityName || cityName}
                                    </Typography>
                                    <Typography variant="body1">
                                        {currentTimeData ? (
                                            currentTimeData.currentTime ? (
                                                <Clock
                                                    time={
                                                        currentTimeData.currentTime
                                                    }
                                                />
                                            ) : (
                                                'Not configured'
                                            )
                                        ) : (
                                            <CircularProgress
                                                style={{
                                                    color: theme.palette.icon
                                                        .inverse,
                                                    marginTop: '4px',
                                                    width: '11px',
                                                    height: '11px',
                                                }}
                                            />
                                        )}
                                    </Typography>
                                </>
                            }
                            arrow={!!timeZoneCity}
                            open={tooltipOpen}
                            placement={getTooltipPlacement(
                                timeZoneCity || ['', 50, 100],
                            )}
                            componentsProps={{
                                popper: {
                                    sx: { zIndex: 1, minWidth: '88px' },
                                },
                            }}
                        >
                            {timeZoneCity &&
                            mapDimensions &&
                            cityLeft &&
                            cityTop ? (
                                <PlaceIcon
                                    sx={{
                                        position: 'absolute',
                                        left: `calc(${cityLeft + 1.5}% - 17px)`,
                                        top: `calc(${cityTop + 13.5}% - 35px)`,
                                    }}
                                    fontSize={'large'}
                                    htmlColor={theme.palette.error.dark}
                                />
                            ) : (
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        left: `${
                                            timeZonePosition + timeZoneWidth / 2
                                        }%`,
                                        top: '100%',
                                    }}
                                />
                            )}
                        </Tooltip>
                    </>
                )}
            </Box>
        </Entitled>
    );
};

export default TimeZoneMap;
