import type { PlatformAccessory, Service } from 'homebridge';
import type { PanaBridgePlatform } from './platform.js';
import type { PanasonicBD, PlayStatus } from './panasonic.js';

export class PanasonicPlatformAccessory {
  private readonly service: Service;
  private readonly unsubscribe: () => void;
  private lastStatus: boolean | null = null;

  constructor(
    private readonly platform: PanaBridgePlatform,
    private readonly accessory: PlatformAccessory,
    private readonly device: PanasonicBD,
  ) {
    this.accessory.getService(this.platform.api.hap.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.api.hap.Characteristic.Manufacturer, 'Panasonic')
      .setCharacteristic(this.platform.api.hap.Characteristic.Model, 'Blu-Ray')
      .setCharacteristic(this.platform.api.hap.Characteristic.SerialNumber, 'N/A');

    this.service =
      this.accessory.getService(this.platform.api.hap.Service.OccupancySensor) ||
      this.accessory.addService(this.platform.api.hap.Service.OccupancySensor);
    this.service.setCharacteristic(
      this.platform.api.hap.Characteristic.Name,
      this.accessory.context.device.displayName,
    );

    this.service
      .getCharacteristic(this.platform.api.hap.Characteristic.OccupancyDetected)
      .onGet(() => this.lastStatus === true);

    this.unsubscribe = this.device.onStatusUpdate((status) => this.onStatusUpdate(status));
  }

  private onStatusUpdate(status: PlayStatus): void {
    const isPresent = status.state === 'playing';
    if (this.lastStatus !== isPresent) {
      this.platform.log.info(
        'Panasonic status changed from',
        this.lastStatus,
        'to',
        isPresent,
      );
      this.lastStatus = isPresent;
    }
    if (this.platform.config.debug) {
      this.platform.log.debug('Panasonic status:', status.state, status.playtime, status.duration);
    }
    this.service.updateCharacteristic(
      this.platform.api.hap.Characteristic.OccupancyDetected,
      isPresent,
    );
  }

  stop(): void {
    this.unsubscribe();
  }
}
