import type { CharacteristicValue, PlatformAccessory, Service } from 'homebridge';
import type { PanaBridgePlatform } from './platform.js';
import type { PanasonicBD } from './panasonic.js';
import { COMMAND_RESET_DELAY_MS } from './commands.js';

export interface CommandSwitchConfig {
  name: string;
  commandKey: string;
}

export class CommandSwitchAccessory {
  constructor(
    private readonly platform: PanaBridgePlatform,
    private readonly accessory: PlatformAccessory,
    private readonly device: PanasonicBD,
    commands: CommandSwitchConfig[],
  ) {
    this.accessory.getService(this.platform.api.hap.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.api.hap.Characteristic.Manufacturer, 'Panasonic')
      .setCharacteristic(this.platform.api.hap.Characteristic.Model, 'Blu-Ray')
      .setCharacteristic(this.platform.api.hap.Characteristic.SerialNumber, accessory.context.device?.host ?? 'N/A');

    const desiredSubtypes = new Set(commands.map((c) => c.commandKey));
    for (const service of [...this.accessory.services]) {
      if (
        service.UUID === this.platform.api.hap.Service.Switch.UUID &&
        service.subtype &&
        !desiredSubtypes.has(service.subtype)
      ) {
        this.accessory.removeService(service);
      }
    }

    for (const cmd of commands) {
      this.addCommandService(cmd);
    }
  }

  private addCommandService(cmd: CommandSwitchConfig): Service {
    const Switch = this.platform.api.hap.Service.Switch;
    const existing = this.accessory.getServiceById(Switch, cmd.commandKey);
    const service = existing ?? this.accessory.addService(Switch, cmd.name, cmd.commandKey);

    service.setCharacteristic(this.platform.api.hap.Characteristic.Name, cmd.name);
    service.setCharacteristic(this.platform.api.hap.Characteristic.ConfiguredName, cmd.name);

    const onChar = service.getCharacteristic(this.platform.api.hap.Characteristic.On);
    onChar.removeAllListeners('get');
    onChar.removeAllListeners('set');
    onChar.onGet(() => false);
    onChar.onSet((value: CharacteristicValue) => {
      if (value === false) {
        return;
      }
      setTimeout(() => {
        service.updateCharacteristic(this.platform.api.hap.Characteristic.On, false);
      }, COMMAND_RESET_DELAY_MS);
      this.device.sendCommand(cmd.commandKey).then((ok) => {
        if (!ok) {
          this.platform.log.warn(`Command ${cmd.commandKey} returned non-ok response`);
        } else if (this.platform.config.debug) {
          this.platform.log.debug(`Sent command ${cmd.commandKey}`);
        }
      }).catch((err) => {
        this.platform.log.warn(`Failed to send command ${cmd.commandKey}:`, err);
      });
    });

    return service;
  }
}
