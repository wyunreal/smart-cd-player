import { Box, useMediaQuery } from '@mui/material';
import BaseCard from 'component/building-blocks/cards/base-card';
import FullScreenSpinner from 'component/building-blocks/full-screen-spinner';
import ResponsiveDialog from 'layout/flows/responsive-dialog';
import { PageTitleContextProvider } from 'layout/utils/page-title-context';
import { createContext, useEffect, useState } from 'react';

type MasterDetailsProps = {
    Master: React.FunctionComponent<{
        onElementSelected: (props: { id: number | string }) => void;
        firstElementSelected?: boolean;
    }>;
    Details: React.FunctionComponent<{
        id: number | string;
        onClose: () => void;
    }>;
    firstElementSelected?: boolean;
};

type LoadingContextType = {
    isLoading: boolean;
    setLoading: (isLoading: boolean) => void;
};

export const LoadingContext = createContext<LoadingContextType>({
    isLoading: false,
    setLoading: () => {},
});

const LoadingContextProvider = ({
    children,
    isLoading,
}: {
    children: React.ReactNode;
    isLoading: boolean;
}) => {
    const [isLoadingState, setIsLoadingState] = useState(isLoading);
    return (
        <LoadingContext.Provider
            value={{
                isLoading: isLoadingState,
                setLoading: (isLoading: boolean) =>
                    setIsLoadingState(isLoading),
            }}
        >
            {children}
        </LoadingContext.Provider>
    );
};

export const hasFixedMasterColumnWidthMq = '(min-width:1200px)';

const DetailsContainer = ({
    isOpen,
    onClose,
    children,
}: {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
}) => {
    const hasFixedMasterColumnWidth = useMediaQuery(
        hasFixedMasterColumnWidthMq,
    );

    const [height, setHeight] = useState(0);

    const [dialogContentRef, setDialogContentRef] =
        useState<HTMLDivElement | null>(null);

    useEffect(() => {
        const resizeObserver = new ResizeObserver(() => {
            setHeight(dialogContentRef ? dialogContentRef.offsetHeight : 0);
        });
        if (dialogContentRef && hasFixedMasterColumnWidth) {
            resizeObserver.observe(dialogContentRef);
            return () => {
                resizeObserver.disconnect();
            };
        }
    });

    return hasFixedMasterColumnWidth ? (
        <BaseCard>
            <Box
                sx={{
                    height: height,
                    transition: 'height 0.5s',
                    overflow: 'hidden',
                }}
            >
                <div
                    style={{ height: 'auto' }}
                    ref={(dialogContentRef) => {
                        setDialogContentRef(dialogContentRef);
                    }}
                >
                    {children}
                </div>
            </Box>
        </BaseCard>
    ) : (
        <PageTitleContextProvider closeButtonHandler={onClose}>
            <ResponsiveDialog isOpen={isOpen} onClose={onClose}>
                {children}
            </ResponsiveDialog>
        </PageTitleContextProvider>
    );
};

const MasterDetails = ({
    Master,
    Details,
    firstElementSelected = false,
}: MasterDetailsProps) => {
    const [selectedId, setSelectedId] = useState<string | number | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const isBigEnough = useMediaQuery(hasFixedMasterColumnWidthMq);
    return (
        <LoadingContextProvider isLoading={false}>
            <LoadingContext.Consumer>
                {({ isLoading }) =>
                    isLoading ? (
                        <FullScreenSpinner />
                    ) : (
                        <Box
                            sx={{
                                display: 'flex',
                                gap: isBigEnough ? 2 : 0,
                            }}
                        >
                            <Box
                                sx={{
                                    maxWidth: isBigEnough ? '400px' : 'auto',
                                    width: isBigEnough ? '400px' : '100%',
                                }}
                            >
                                <Master
                                    onElementSelected={({ id }) => {
                                        setSelectedId(id);
                                        setIsOpen(true);
                                    }}
                                    firstElementSelected={
                                        firstElementSelected && isBigEnough
                                    }
                                />
                            </Box>
                            <Box
                                sx={{
                                    flex: 1,
                                }}
                            >
                                <Box sx={{ position: 'sticky', top: '0px' }}>
                                    <DetailsContainer
                                        isOpen={isOpen}
                                        onClose={() => setIsOpen(false)}
                                    >
                                        {selectedId && (
                                            <Details
                                                id={selectedId}
                                                onClose={() => setIsOpen(false)}
                                            />
                                        )}
                                    </DetailsContainer>
                                </Box>
                            </Box>
                        </Box>
                    )
                }
            </LoadingContext.Consumer>
        </LoadingContextProvider>
    );
};

export default MasterDetails;
