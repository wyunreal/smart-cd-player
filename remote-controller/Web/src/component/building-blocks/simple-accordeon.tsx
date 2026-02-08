import styled from '@mui/material/styles/styled';
import useTheme from '@mui/material/styles/useTheme';
import Box from '@mui/material/Box';
import React, { useState } from 'react';
import { Theme } from '@mui/material';
import Typography from '@mui/material/Typography';
import MuiAccordion, { AccordionProps } from '@mui/material/Accordion';
import MuiAccordionSummary, {
    AccordionSummaryProps,
} from '@mui/material/AccordionSummary';
import MuiAccordionDetails from '@mui/material/AccordionDetails';
import { FakeLink } from 'component/building-blocks/fake-link';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const StyledAccordion = styled((props: AccordionProps) => (
    <MuiAccordion disableGutters elevation={0} square {...props} />
))(() => ({
    '&:before': {
        display: 'none',
    },
}));

const AccordionSummary = styled((props: AccordionSummaryProps) => (
    <MuiAccordionSummary {...props} />
))(() => ({
    alignItems: 'center',
    paddingLeft: 0,
    paddingRight: 0,
    '& .MuiAccordionSummary-content': {
        margin: 0,
    },
}));

const AccordionDetails = styled(MuiAccordionDetails)(({ theme }) => ({
    borderTop: `1px solid ${theme.palette.divider}`,
    paddingLeft: 0,
    paddingRight: 0,
    paddingBottom: 0,
}));

type HandleTopicChange = (
    topic: string,
) => (event: React.SyntheticEvent, isExpanded: boolean) => void;

const Topic = ({
    topicId,
    isExpanded,
    handleChange,
    children,
}: {
    topicId: string;
    isExpanded: boolean;
    handleChange: HandleTopicChange;
    children: NonNullable<React.ReactNode>;
}) => (
    <StyledAccordion expanded={isExpanded} onChange={handleChange(topicId)}>
        {children}
    </StyledAccordion>
);

const Summary = ({
    sectionId,
    title,
    description,
    withArrow,
}: {
    sectionId: string;
    title: string;
    description?: string;
    withArrow: boolean;
}) => {
    return (
        <AccordionSummary
            id={sectionId}
            expandIcon={withArrow && <ExpandMoreIcon />}
        >
            {!withArrow ? (
                <Box sx={{ display: 'block', paddingBottom: 2 }}>
                    <FakeLink>
                        <Box sx={{ paddingBottom: 1 }}>
                            <Typography variant="h6">{title}</Typography>
                        </Box>
                    </FakeLink>
                    {description && (
                        <Box sx={{ mt: 0.5 }}>
                            <Typography variant="subtitle2">
                                {description}
                            </Typography>
                        </Box>
                    )}
                </Box>
            ) : (
                title
            )}
        </AccordionSummary>
    );
};

const Content = ({ children }: { children: React.ReactNode; theme: Theme }) => (
    <AccordionDetails>
        <Typography
            variant="subtitle2"
            sx={{
                mt: 0.5,
            }}
        >
            {children}
        </Typography>
    </AccordionDetails>
);

type Props = {
    selectedTopicIndex?: number | null;
    topics: {
        [key: string]: {
            sectionId: string;
            title: string;
            description?: string;
            content: React.ReactNode;
        };
    };
    withArrow?: boolean;
};

const Accordion = ({
    selectedTopicIndex,
    topics,
    withArrow = false,
}: Props) => {
    const theme = useTheme();
    const [expanded, setExpanded] = useState<string | null>(
        selectedTopicIndex !== null && selectedTopicIndex !== undefined
            ? Object.keys(topics)[selectedTopicIndex]
            : null,
    );

    const handleTopicChange =
        (panel: string) =>
        (event: React.SyntheticEvent, isExpanded: boolean) => {
            setExpanded(isExpanded ? panel : null);
        };

    return (
        <>
            {Object.keys(topics).map((topicId) => {
                const { title, description, content } = topics[topicId];
                return (
                    <Topic
                        key={topicId}
                        topicId={topicId}
                        isExpanded={expanded === topicId}
                        handleChange={handleTopicChange}
                    >
                        <Summary
                            sectionId={topicId}
                            title={title}
                            description={description}
                            withArrow={withArrow}
                        />
                        <Content theme={theme}>{content}</Content>
                    </Topic>
                );
            })}
        </>
    );
};

export default Accordion;
