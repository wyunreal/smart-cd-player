"use client";

import {
  Box,
  IconButton,
  Slider,
  Switch,
  Typography,
} from "@mui/material";
import useTheme from "@mui/material/styles/useTheme";
import useMediaQuery from "@mui/material/useMediaQuery";
import ResponsiveDialog from "@/app/components/client/dialog/responsive-dialog";
import useAudioStream from "@/app/hooks/use-audio-stream";
import {
  EQ_BANDS,
  EQ_MIN_DB,
  EQ_MAX_DB,
} from "@/app/providers/audio-stream-provider";
import RestartAltIcon from "@mui/icons-material/RestartAlt";

const formatBand = (freq: number): string =>
  freq >= 1000 ? `${freq / 1000}k` : `${freq}`;

type EqualizerDialogProps = {
  isOpen: boolean;
  onClose: () => void;
};

const EqualizerDialog = ({ isOpen, onClose }: EqualizerDialogProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { eqEnabled, setEqEnabled, eqGains, setEqGain, resetEq } =
    useAudioStream();

  const sliderHeight = isMobile ? 140 : 200;

  return (
    <ResponsiveDialog
      title="Ecualizador"
      isOpen={isOpen}
      onClose={onClose}
      adaptToContentInMobile
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Switch
            checked={eqEnabled}
            onChange={(_, checked) => setEqEnabled(checked)}
            size="small"
          />
          <Typography variant="body2" color="text.secondary">
            {eqEnabled ? "Activado" : "Desactivado"}
          </Typography>
        </Box>
        <IconButton onClick={resetEq} size="small" title="Reset">
          <RestartAltIcon fontSize="small" />
        </IconButton>
      </Box>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: isMobile ? 0.25 : 1,
          px: isMobile ? 0 : 1,
        }}
      >
        {EQ_BANDS.map((freq, i) => (
          <Box
            key={freq}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              flex: 1,
              minWidth: 0,
            }}
          >
            <Box sx={{ height: sliderHeight }}>
              <Slider
                orientation="vertical"
                min={EQ_MIN_DB}
                max={EQ_MAX_DB}
                step={0.5}
                value={eqGains[i]}
                onChange={(_, value) => setEqGain(i, value as number)}
                disabled={!eqEnabled}
                valueLabelDisplay="auto"
                valueLabelFormat={(v) => `${v > 0 ? "+" : ""}${v} dB`}
                sx={{
                  '& .MuiSlider-thumb': {
                    width: isMobile ? 14 : 16,
                    height: isMobile ? 14 : 16,
                  },
                  '& .MuiSlider-track': {
                    width: isMobile ? 3 : 4,
                  },
                  '& .MuiSlider-rail': {
                    width: isMobile ? 3 : 4,
                  },
                }}
              />
            </Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                mt: 1,
                fontSize: isMobile ? "0.6rem" : "0.7rem",
                lineHeight: 1,
                whiteSpace: "nowrap",
              }}
            >
              {formatBand(freq)}
            </Typography>
          </Box>
        ))}
      </Box>

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: "block", textAlign: "center", mt: 2 }}
      >
        Hz
      </Typography>
    </ResponsiveDialog>
  );
};

export default EqualizerDialog;
