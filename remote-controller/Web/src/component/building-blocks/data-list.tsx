import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import ListItemText from '@mui/material/ListItemText';
import SvgIcon from '@mui/material/SvgIcon';
import ChevronRightOutlinedIcon from '@mui/icons-material/ChevronRightOutlined';
import { NavigateFunction, useNavigate } from 'react-router-dom';
import useTheme from '@mui/material/styles/useTheme';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Fade from '@mui/material/Fade';
import { TransitionGroup } from 'react-transition-group';
import { Collapse } from '@mui/material';
import { IconType } from 'component/types';

type DataListItem = {
    icon: React.ReactNode;
    title: string;
    description?: string;
    url?: string;
    handler?: () => void;
    RightActionIcon?: IconType;
    rightActionButton?: React.ReactNode;
    configured?: boolean;
    withTag?: boolean;
    withColoredIcon?: boolean;
};

export type DataListProps = {
    items: DataListItem[];
};

const getItemLinkProps = (item: DataListItem, navigate: NavigateFunction) => {
    return item.url || item.handler
        ? {
              onClick: () => {
                  setTimeout(() => {
                      if (item.url) {
                          navigate(item.url);
                      } else if (item.handler) {
                          item.handler();
                      }
                  }, 350);
              },
          }
        : {};
};

const DataList = ({ items }: DataListProps) => {
    const theme = useTheme();
    const navigate = useNavigate();
    const rightActionIconColor =
        theme.palette.mode === 'dark' ? 'inherit' : 'rgba(0, 0, 0, 0.54)';
    return (
        <List>
            <TransitionGroup>
                {items.map(
                    (
                        { RightActionIcon, rightActionButton, ...item },
                        index,
                    ) => (
                        <Collapse key={index}>
                            <ListItem
                                alignItems="flex-start"
                                disableGutters
                                sx={{
                                    paddingTop: 0,
                                    paddingBottom: 0,
                                }}
                            >
                                <ListItemButton
                                    {...getItemLinkProps(item, navigate)}
                                    sx={{
                                        marginLeft: '-16px',
                                        marginRight: '-16px',
                                    }}
                                    disableRipple={
                                        !!rightActionButton &&
                                        !item.url &&
                                        !item.handler
                                    }
                                    disableTouchRipple={
                                        !!rightActionButton &&
                                        !item.url &&
                                        !item.handler
                                    }
                                >
                                    {item.withColoredIcon ? (
                                        <ListItemAvatar>
                                            <Avatar
                                                variant="rounded"
                                                sx={{
                                                    backgroundColor:
                                                        theme.palette.extra[
                                                            index %
                                                                theme.palette
                                                                    .extra
                                                                    .length
                                                        ],
                                                    width: 34,
                                                    height: 34,
                                                    borderRadius: '10px',
                                                }}
                                            >
                                                <SvgIcon
                                                    htmlColor={
                                                        theme.palette.icon
                                                            .inverse
                                                    }
                                                >
                                                    {item.icon}
                                                </SvgIcon>
                                            </Avatar>
                                        </ListItemAvatar>
                                    ) : (
                                        <Box sx={{ marginRight: 2 }}>
                                            {item.icon}
                                        </Box>
                                    )}
                                    <ListItemText
                                        primary={
                                            item.withTag === false ? (
                                                item.title
                                            ) : (
                                                <>
                                                    <Fade
                                                        in={
                                                            item.configured !==
                                                            undefined
                                                        }
                                                    >
                                                        <Box
                                                            sx={{
                                                                color: item.configured
                                                                    ? theme
                                                                          .palette
                                                                          .success
                                                                          .main
                                                                    : theme
                                                                          .palette
                                                                          .error
                                                                          .main,
                                                                height: '24px',
                                                            }}
                                                        >
                                                            <Typography variant="overline">
                                                                {item.configured
                                                                    ? 'Configured'
                                                                    : item.configured ===
                                                                      false
                                                                    ? 'Not configured'
                                                                    : ''}
                                                            </Typography>
                                                        </Box>
                                                    </Fade>
                                                    <Box>{item.title}</Box>
                                                </>
                                            )
                                        }
                                        secondary={item.description}
                                        sx={{ marginRight: '32px' }}
                                    />
                                    {(item.url || item.handler) &&
                                        !rightActionButton && (
                                            <ListItemSecondaryAction
                                                sx={{ marginLeft: 16 }}
                                            >
                                                {RightActionIcon ? (
                                                    <RightActionIcon
                                                        color="inherit"
                                                        sx={{
                                                            color: rightActionIconColor,
                                                        }}
                                                    />
                                                ) : (
                                                    <ChevronRightOutlinedIcon
                                                        color="inherit"
                                                        sx={{
                                                            marginTop: '10px',
                                                            color: rightActionIconColor,
                                                        }}
                                                    />
                                                )}
                                            </ListItemSecondaryAction>
                                        )}
                                    {rightActionButton && (
                                        <ListItemSecondaryAction
                                            sx={{ marginLeft: 16 }}
                                        >
                                            {rightActionButton}
                                        </ListItemSecondaryAction>
                                    )}
                                </ListItemButton>
                            </ListItem>
                            <Divider component="li" />
                        </Collapse>
                    ),
                )}
            </TransitionGroup>
        </List>
    );
};

export default DataList;
