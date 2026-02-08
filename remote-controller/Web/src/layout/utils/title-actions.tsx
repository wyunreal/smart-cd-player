import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import useTheme from '@mui/material/styles/useTheme';
import React, { useContext, useEffect, useState } from 'react';
import { TitleContext } from 'layout/utils/page-title-context';
import useMediaQuery from '@mui/material/useMediaQuery';
import Fade from '@mui/material/Fade';
import Action from 'component/building-blocks/action';

const Animation = ({
    children,
    animate,
}: {
    children: React.ReactElement;
    animate: boolean;
}) => {
    const [animation, startAnimation] = useState(false);
    useEffect(() => {
        const handler = setTimeout(() => startAnimation(true), 350);
        return () => clearTimeout(handler);
    });
    return animate ? <Fade in={animation}>{children}</Fade> : <>{children}</>;
};

const TitleActions = ({
    showAvatar = true,
    withDarkBackground = false,
}: {
    showAvatar?: boolean;
    withDarkBackground?: boolean;
}) => {
    const theme = useTheme();
    const titleContext = useContext(TitleContext);
    const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
    return (
        <>
            {titleContext.actions?.length
                ? titleContext.actions?.map((action, index) => (
                      <Animation
                          key={`${index}-${action.action.caption}`}
                          animate={isDesktop}
                      >
                          <Box paddingLeft={1}>
                              <Action
                                  actionParams={action}
                                  withDarkBackground={withDarkBackground}
                                  actionKey={index}
                              />
                          </Box>
                      </Animation>
                  ))
                : showAvatar && (
                      <Box sx={{ flexGrow: 0 }}>
                          <IconButton sx={{ p: 0 }}>
                              <Avatar sx={{ width: 32, height: 32 }} />
                          </IconButton>
                      </Box>
                  )}
        </>
    );
};

export default TitleActions;
