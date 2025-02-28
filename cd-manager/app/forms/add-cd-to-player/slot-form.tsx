import { StepProps } from "@/app/components/client/flow";
import { AddCdToPlayerData } from "./types";

const SlotForm = ({ data }: StepProps<AddCdToPlayerData>) => (
  <>{`Slot selection for cd ${data.cd?.id}`}</>
);

export default SlotForm;
