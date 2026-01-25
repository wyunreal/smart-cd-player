import { Art, Cd } from "@/api/types";

export type AddCdData = {
  barCode: string;
  cd?: Cd;
  selectedCdArtIndex?: number;
  selectedArtistArtIndex?: number;
  arts?: Art[];
  artistArts?: Art[];
  artistName?: string;
};
