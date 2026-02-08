import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Box from '@mui/material/Box';
import BaseCard from './base-card';
import { Category } from '../../types';
import Link from '@mui/material/Link';
import { useState } from 'react';

const CategorizedDataCards = ({
    data,
    noTitle,
}: {
    data: Category[];
    noTitle?: boolean;
}) => {
    const [displayPassword, setDisplayPassword] = useState(false);
    return (
        <>
            {data.map(({ category, content }, categoryIndex) => (
                <Box key={categoryIndex} sx={{ minWidth: 250 }}>
                    <BaseCard
                        key={categoryIndex}
                        title={noTitle ? undefined : category}
                    >
                        <List dense sx={{ padding: 0 }}>
                            {content.map(
                                ({ icon, name, value, type }, contentIndex) =>
                                    value !== '' && (
                                        <ListItem
                                            key={`${categoryIndex}_${contentIndex}`}
                                            sx={{
                                                padding: 0,
                                                alignItems: 'flex-start',
                                            }}
                                        >
                                            <ListItemIcon>{icon}</ListItemIcon>
                                            <ListItemText
                                                primary={name}
                                                secondary={
                                                    type === 'text' ||
                                                    type === undefined ||
                                                    displayPassword ? (
                                                        value
                                                    ) : (
                                                        <Link
                                                            component="button"
                                                            onClick={() =>
                                                                setDisplayPassword(
                                                                    true,
                                                                )
                                                            }
                                                        >
                                                            See password
                                                        </Link>
                                                    )
                                                }
                                            />
                                        </ListItem>
                                    ),
                            )}
                        </List>
                    </BaseCard>
                </Box>
            ))}
        </>
    );
};

export default CategorizedDataCards;
