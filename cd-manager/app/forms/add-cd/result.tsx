import { Cd } from "@/api/types";
import CdRow from "@/app/components/client/cd-row";
import { Alert, Stack, Typography } from "@mui/material";
import Image from "next/image";

const AddCdResult = ({ result }: { result: Cd | null }) =>
  result !== null ? (
    <Stack spacing={2}>
      <Typography>CD Added:</Typography>
      <CdRow cd={result} />
      <Typography>Artwork:</Typography>
      <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
        {result.art?.artist?.uri150 && (
          <Image
            src={result.art?.artist?.uri150}
            alt="Success"
            width={64}
            height={64}
          />
        )}
        {result.art?.cd?.uri150 && (
          <Image
            style={{ borderRadius: "50%" }}
            src={result.art?.cd?.uri150}
            alt="Success"
            width={64}
            height={64}
          />
        )}
      </Stack>
    </Stack>
  ) : (
    <Alert severity="error">Error adding CD. Please try again.</Alert>
  );

export default AddCdResult;
