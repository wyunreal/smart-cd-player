import { Cd } from "@/api/types";

export type AddCdToPlayerData = {
  player?: number;
  slot?: number;
  cd?: Cd;
};
