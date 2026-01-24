import { AlbumArt, Art, Cd } from "@/api/types";

export type AddCdData = {
  barCode: string;
  cd?: Cd;
  arts?: Art[];
};
