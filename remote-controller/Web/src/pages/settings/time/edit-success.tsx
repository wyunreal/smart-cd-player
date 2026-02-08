import { GridItem } from 'layout/utils';
import PageTitle from 'layout/utils/page-title';
import RestartRequired from 'component/features/restart-required';

const EditSuccess = ({ handleClose }: { handleClose: () => void }) => {
    return (
        <PageTitle title="Time settings saved" actions={[]}>
            <GridItem>
                <RestartRequired handleClose={handleClose} />
            </GridItem>
        </PageTitle>
    );
};

export default EditSuccess;
