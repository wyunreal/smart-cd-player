<!-- Copilot / AI agent instructions tailored to the SmartCdPlayer module -->
# Copilot Instructions — SmartCdPlayer firmware

Purpose: give an AI coding agent the minimal, actionable context to make productive changes to this PlatformIO-based ESP32 firmware module.

- **Big picture**: this repo is a PlatformIO Arduino-based firmware module for an ESP32 (environment: `woroom_wroom32` in [platformio.ini](platformio.ini)). The runtime is driven from [src/common/main.cpp](src/common/main.cpp): network (Wi‑Fi) comes up, `Time` is initialized, the web server and a command executor are started, and `Controller::instance()` participates in `setup()` and `loop()`.

- **Key components & boundaries**:
  - Web/API layer: `ModuleWebServer`, `WebServerCommandExecutor` and WebSocket handling (see [src/common/main.cpp](src/common/main.cpp)). Messages from clients are queued into `Store::instance()` via `webSocketMessageHandler`.
  - Core module logic: `Controller` ([src/Controller.h](src/Controller.h) / [src/Controller.cpp](src/Controller.cpp)) — IR send/receive and per-module behaviors live here.
  - Common services: `ModuleWifi`, `TaskScheduler`, `Store`, `Time`, `Entity` — singletons with `instance()` and lifecycle calls (`begin()` / `execute()` / `handle*()`).
  - Commands: Command handlers follow the `Command` interface in [src/common/command/Command.h](src/common/command/Command.h). Handlers are registered in `src/commands/Commands.hpp` by inserting into a `std::map<String, Command *>`.
  - Hardware/config: compile-time macros and pins live in [src/common/config/Hardware.h](src/common/config/Hardware.h) and module-level `Config.h`.
  - IR: `IrRemoteControl` API is in [src/common/ir/ir.h](src/common/ir/ir.h) and used by the `Controller`.

- **Typical runtime flow** (important to preserve):
  1. `main.cpp::setup()` initializes `Store`, `WebServerCommandExecutor`, `ModuleWifi` and registers `onWifiConnected`.
  2. On Wi‑Fi ready -> `Time::begin()`, `ModuleWebServer::begin()`, set `initialized = true`.
  3. `loop()` runs scheduler, command executor, wifi state handling, and `Controller::loop()` (skips work if update in progress).

- **Coding patterns / conventions to follow**:
  - Singletons: classes expose `static X &instance()` returning a private static field (e.g., `Commands::instance()`). Use that pattern when adding services.
  - Lifecycle methods: prefer `.begin()` / `.setup(bool initialized)` for initialization and `.execute()` / `.loop()` / `.handle*()` for periodic work.
  - JSON command handling: `Command::execute()` returns a `DynamicJsonDocument *` and uses `COMMAND_*` keys defined in `Hardware.h`. Maintain this shape when adding new commands.
  - Use macros for optional features: `ENTITY_DATA_PARTITIONS`, `MAX_ENTITIES_COUNT` gate entity-related code paths.
  - Debugging: `DEBUG_ENABLED` and `DEBUG_SERIAL_BAUDS` are defined in [src/common/config/Hardware.h](src/common/config/Hardware.h). Use `Serial` logging consistent with existing style.

- **Build / flash / debug** (concrete commands)
  - Build: `platformio run` (or `platformio run -e woroom_wroom32` to target the module environment).
  - Upload/Flash: `platformio run -e woroom_wroom32 -t upload` (device must be connected; PlatformIO reads the board from [platformio.ini](platformio.ini)).
  - Monitor/Serial: `platformio device monitor -e woroom_wroom32 --speed 115200` or `platformio device monitor -e woroom_wroom32`. Monitor speed is `115200` per `monitor_speed`.
  - Extra packaging: [platformio.ini](platformio.ini) sets `data_dir = data.gz` and uses `extra_script.py` — the `data/` folder contains web assets included in firmware. Be careful editing assets without re-running the packaging step.
  - Node helper: timezone generation is done by `tasks/generateTimeZones.js`. Run with `node ./tasks/generateTimeZones.js` when updating `time-zones` assets.

- **Where to make changes for common tasks (examples)**
  - Add a new web command: create a `Command` subclass (implement `execute()`), register it in `src/commands/Commands.hpp` map. Use `WebServerCommandExecutor` for routing.
  - Add IR handling: extend `IrRemoteControl` usage inside `Controller::enableIrLearnMode()` / `Controller::loop()` (see [src/Controller.cpp](src/Controller.cpp)). Respect `IR_MODE_SEND` / `IR_MODE_RECEIVE` toggles.
  - Add new entity partition: supply `ENTITY_DATA_PARTITIONS` macro in a header to include the partition definition; the system will load it during `Entity::instance().begin()`.

- **Integration & external deps**
  - PlatformIO + Espressif32 Arduino framework (see [platformio.ini](platformio.ini)).
  - IR libraries (`IRrecv`, `IRsend`, `IRutils`) included via PlatformIO library dependencies.
  - ArduinoJson is used for command payloads (`Command.h`).

- **Quick do's & don'ts for code changes**
  - Do: follow `instance()` singleton and `begin()/execute()` lifecycle style; update `main.cpp` only when you must change global initialization.
  - Do: update `data/` and re-run the packaging step if changing web assets; use `tasks/generateTimeZones.js` for timezone data.
  - Don't: change the web socket message shape—commands rely on keys defined in `Hardware.h`.

If anything here is incomplete or you want more examples (e.g., a template `Command` implementation), tell me which area to expand and I will iterate.
