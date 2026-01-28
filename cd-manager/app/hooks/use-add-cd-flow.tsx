import { useContext, useState } from "react";
import ResponsiveDialog from "../components/client/dialog/responsive-dialog";
import Flow from "../components/client/flow";
import { AddCdData } from "../forms/add-cd/types";
import SearchCdForm from "../forms/add-cd/search-cd";
import CdArtForm from "../forms/add-cd/cd-art";
import { validate as validateCdSelection } from "../forms/add-cd/search-cd";
import ArtistArtForm from "../forms/add-cd/artist-art";
import { DataRepositoryContext } from "../providers/data-repository";
import { useCdSelection } from "../providers/cd-selection-context";
import { Cd, Track } from "@/api/types";
import AddCdResult from "../forms/add-cd/result";
import { addCd } from "@/api/cd-collection";

const useAddCdFlow = () => {
  const [isAddCdFlowOpen, setIsAddCdFlowOpen] = useState(false);
  const { refreshCds } = useContext(DataRepositoryContext);
  const { selectCdById } = useCdSelection();
  const closeDialog = () => setIsAddCdFlowOpen(false);
  const [createdCdId, setCreatedCdId] = useState<number | null>(null);

  const splitCdIntoMultipleIfNeeded = (cd: Cd): Cd[] => {
    const cdTracksMap: { [diskNumber: number]: Track[] } = cd.tracks.reduce(
      (map, track) => {
        const diskNumber = track.cd || 1;
        if (!map[diskNumber]) {
          map[diskNumber] = [];
        }
        map[diskNumber].push(track);
        return map;
      },
      {} as { [diskNumber: number]: Track[] },
    );
    const cds: Cd[] = Object.entries(cdTracksMap).map(
      ([diskNumberStr, tracks]) => {
        const diskNumber = parseInt(diskNumberStr, 10);
        return {
          ...cd,
          tracks: [...tracks], // shallow copy of tracks
          art: {
            album: cd.art?.album && { ...cd.art?.album },
            cd: cd.art?.cd && { ...cd.art?.cd },
            artist: cd.art?.artist && { ...cd.art?.artist },
          }, // shallow copy of art
          diskNumber: diskNumber,
          diskAmount: Object.keys(cdTracksMap).length,
        };
      },
    );
    return cds;
  };

  return {
    openAddCdFlow: () => {
      setIsAddCdFlowOpen(true);
    },
    addCdFlowInstance: (
      <ResponsiveDialog
        title="Add CD"
        isOpen={isAddCdFlowOpen}
        onClose={closeDialog}
      >
        <Flow<AddCdData, Cd | null>
          steps={[
            {
              title: "Search CD",
              content: SearchCdForm,
              validate: validateCdSelection,
            },
            {
              title: "Select CD picture",
              content: CdArtForm,
              validate: () => null,
            },
            {
              title: "Select artist picture",
              content: ArtistArtForm,
              validate: () => null,
            },
          ]}
          ResultScreen={AddCdResult}
          initialData={{ barCode: "", cd: undefined }}
          operationName="Add CD to collection"
          closeActionName="Close"
          onDataSubmission={async (data) => {
            if (!data.cd) {
              return null;
            }
            try {
              const cds = splitCdIntoMultipleIfNeeded(data.cd);
              const cdIds = await addCd(cds);
              setCreatedCdId(cdIds[0]);
              return {
                ...data.cd,
                id: cdIds[0],
              };
            } catch (error) {
              console.error("Error adding CD:", error);
              return null;
            }
          }}
          onResultReception={(result) => {
            if (result !== null) {
              setCreatedCdId(result.id);
            }
          }}
          onClose={() => {
            closeDialog();
            if (createdCdId !== null) {
              refreshCds();
              setTimeout(() => {
                selectCdById(createdCdId);
              }, 100);
            }
          }}
        />
      </ResponsiveDialog>
    ),
  };
};

export default useAddCdFlow;
