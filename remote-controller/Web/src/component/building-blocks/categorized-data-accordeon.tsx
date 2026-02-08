import { Category } from '../types';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import useTheme from '@mui/material/styles/useTheme';
import Accordion from './simple-accordeon';

const CategorizedDataAccordeon = ({
    data,
    firstOpened = true,
}: {
    data: Category[];
    firstOpened?: boolean;
}) => {
    const theme = useTheme();
    return (
        <Accordion
            selectedTopicIndex={firstOpened ? 0 : undefined}
            topics={data.reduce(
                (acc, { category, content }) => ({
                    ...acc,
                    [category]: {
                        sectionId: category,
                        title: category,
                        content: (
                            <List
                                dense
                                sx={{
                                    padding: 0,
                                    [theme.breakpoints.up('sm')]: {
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                    },
                                }}
                            >
                                {content.map(
                                    ({ icon, name, value }, contentIndex) =>
                                        value !== '' && (
                                            <ListItem
                                                key={`${category}_${contentIndex}`}
                                                sx={{
                                                    padding: 0,
                                                    alignItems: 'flex-start',
                                                    [theme.breakpoints.up(
                                                        'sm',
                                                    )]: {
                                                        minWidth: '50%',
                                                        maxWidth: '50%',
                                                    },
                                                }}
                                            >
                                                <ListItemIcon>
                                                    {icon}
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={name}
                                                    secondary={value}
                                                />
                                            </ListItem>
                                        ),
                                )}
                            </List>
                        ),
                    },
                }),
                {},
            )}
            withArrow
        />
    );
};

export default CategorizedDataAccordeon;
