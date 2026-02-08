import {
    FormControl,
    FormControlLabel,
    FormLabel,
    Radio,
    RadioGroup,
} from '@mui/material';
import {
    IrCommandsSettingsData,
    LearnMode,
} from 'api-client/methods/ir-commands-settings';
import { GridItem } from 'layout/utils';
import { useState } from 'react';

export const validateLearnMode = (data: IrCommandsSettingsData) => {
    return {};
};

const LearnModeForm = ({
    data,
    setData,
}: {
    data: IrCommandsSettingsData;
    setData: React.Dispatch<React.SetStateAction<IrCommandsSettingsData>>;
}) => {
    const [learnMode, setLearnMode] = useState<LearnMode>(
        data.learnMode !== undefined ? data.learnMode : LearnMode.AllCommands,
    );

    return (
        <GridItem>
            <FormControl>
                <FormLabel id="learn-mode-label">Learn mode</FormLabel>
                <RadioGroup
                    aria-labelledby="learn-mode-label"
                    name="learn-mode-group"
                >
                    <FormControlLabel
                        control={<Radio />}
                        label="All commands"
                        checked={learnMode === LearnMode.AllCommands}
                        onChange={() => {
                            setData((data) => ({
                                ...data,
                                learnMode: LearnMode.AllCommands,
                            }));
                            setLearnMode(LearnMode.AllCommands);
                        }}
                    />
                    <FormControlLabel
                        control={<Radio />}
                        label="All commands from missing groups"
                        checked={
                            learnMode ===
                            LearnMode.AllCommandsFromIncompleteGroups
                        }
                        onChange={() => {
                            setData((data) => ({
                                ...data,
                                learnMode:
                                    LearnMode.AllCommandsFromIncompleteGroups,
                            }));
                            setLearnMode(
                                LearnMode.AllCommandsFromIncompleteGroups,
                            );
                        }}
                    />
                    <FormControlLabel
                        control={<Radio />}
                        label="Only missing commands"
                        checked={learnMode === LearnMode.OnlyMissingCommands}
                        onChange={() => {
                            setData((data) => ({
                                ...data,
                                learnMode: LearnMode.OnlyMissingCommands,
                            }));
                            setLearnMode(LearnMode.OnlyMissingCommands);
                        }}
                    />
                </RadioGroup>
            </FormControl>
        </GridItem>
    );
};
export default LearnModeForm;
