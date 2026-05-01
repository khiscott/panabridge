# Panabridge

Panabridge is a Homebridge plugin for Panasonic Blu-ray players. It exposes the player's current state as HomeKit Occupancy Sensors and (optionally, on patched UB firmware or stock BD firmware) the full remote-control command set as switches.

Derived from the [Home Assistant Panasonic Blu-ray integration](https://www.home-assistant.io/integrations/panasonic_bluray/) and [python-panacotta](https://github.com/u1f35c/python-panacotta), with command behaviour cross-referenced against [albaintor/integration_panasonicbluray](https://github.com/albaintor/integration_panasonicbluray).

## Features

- **Legacy status sensor** — an Occupancy Sensor that's "occupied" while the player is `playing`. Always registered. Use as an automation trigger (dim lights when a movie starts, etc.).
- **Optional state sensors** — opt-in Occupancy Sensors that surface other useful states:
  - **Power** — occupied when the player is on (any state except off / standby).
  - **Playing** — occupied while actively playing (duplicate of the legacy sensor; enable only if you want a separate tile).
  - **Active** — occupied while the disc is moving (playing *or* fast-forward / rewind).
- **Command groups (patched firmware only)** — define groups in config (e.g. *Transport*, *Menu*, *Picture*), pick commands per group, each becomes a momentary switch.

## Tested Device

- **Model:** UB820 / UB9000

## Compatibility

| Player | LAN status reads (sensors) | LAN command writes (switches) |
| ------ | -------------------------- | ----------------------------- |
| BD-series (DMP-BDT…) | ✅ Works | ✅ Works |
| UB-series, stock firmware (UB820, UB9000…) | ✅ Works | ❌ Player returns `52 / 認証に失敗しました` (auth required) |
| UB-series, patched firmware | ✅ Works | ✅ Works |

The `cCMD_PST` status endpoint is unauthenticated on all firmwares, so the sensors always work. The `cCMD_RC_*` command endpoint is auth-gated on UB stock firmware. Panasonic deprecated their official Voice Control / Alexa / Google Home integration for UB players in June 2023, so there's no current first-party app to extract credentials from. The community workaround is the third-party firmware patch — see albaintor's [FIRMWARE_PATCH.md](https://github.com/albaintor/integration_panasonicbluray/blob/main/FIRMWARE_PATCH.md).

> **Network Voice Control** must be enabled on the player (Setup → Network → Network Voice Control), even though the cloud side is dead — the local listener is what we talk to.

## Configuration

Minimum config (just the legacy sensor):

```json
{
  "platform": "PanaBridge",
  "name": "BluRay Player",
  "host": "192.168.1.50"
}
```

With state sensors:

```json
{
  "platform": "PanaBridge",
  "name": "BluRay Player",
  "host": "192.168.1.50",
  "sensors": {
    "power": true,
    "active": true
  }
}
```

With command groups (patched firmware):

```json
{
  "platform": "PanaBridge",
  "name": "BluRay Player",
  "host": "192.168.1.50",
  "pollInterval": 5000,
  "sensors": { "power": true },
  "groups": [
    { "name": "Transport", "commands": ["PLAYBACK", "PAUSE", "STOP", "SKIPFWD", "SKIPREV"] },
    { "name": "Menu",      "commands": ["MLTNAVI", "MENU", "RETURN", "EXIT", "DSPSEL"]      }
  ]
}
```

The Homebridge UI renders sensors as checkboxes and groups as an editable list with multi-select per group — you don't need to edit JSON by hand.

### Options

| Field          | Default | Description                                                                            |
| -------------- | ------- | -------------------------------------------------------------------------------------- |
| `host`         | —       | IP address of the player. Required.                                                    |
| `pollInterval` | `5000`  | How often (ms) to poll for status. Lower is more responsive but harder on the player.  |
| `debug`        | `false` | Verbose logging — includes raw HTTP responses from the player.                          |
| `sensors`      | `{}`    | Object with `power` / `playing` / `active` booleans. Each enables an Occupancy Sensor.  |
| `groups`       | `[]`    | Array of `{ name, commands[] }`. Each becomes one accessory tile of momentary switches. **Only works on patched UB firmware or stock BD firmware.** |

## Installation

Search for `homebridge-panasonic-bluray-players` in your Homebridge UI and click install.
