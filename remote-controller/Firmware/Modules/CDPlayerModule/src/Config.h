#ifndef CONFIG_H
#define CONFIG_H

#define MODULE_TYPE "cdplayer"

#define WEB_SERVER_CONCURRENT_CLIENTS_COUNT 3
#define WEB_SERVER_MESSAGE_MAX_LEN 2048

#define DEVICE_NAME_MAX_LEN 12

#define IR_LEARN_MODE_TIMEOUT_MS 30000
#define IR_LEARN_MODE_LOOP_INTERVAL_MS 250

// Sony S-Link (Control A1) configuration
// NOTE: S-Link is 5V, ESP32 GPIO is 3.3V - a bidirectional level shifter is required
#define SLINK_PIN 13                // GPIO for S-Link data line (3.5mm mono jack)
#define SLINK_POLL_INTERVAL_MS 500  // Status polling interval
// Command bytes for CDP-CX not defined in Sony_SLink library
#define SLINK_CMD_CDP_POWER_ON_BYTE 0x2E
#define SLINK_CMD_CDP_POWER_OFF_BYTE 0x2F
#define SLINK_CMD_CDP_PLAY_DISC_TRACK_BYTE 0x50  // Play specific disc/track
#define SLINK_CMD_CDP_REQUEST_NAME 0x6A         // Request device name (triggers status response)

#endif