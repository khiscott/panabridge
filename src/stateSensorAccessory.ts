import type { PlatformAccessory, Service } from 'homebridge';
import type { PanaBridgePlatform } from './platform.js';
import type { PanasonicBD, PlayState, PlayStatus } from './panasonic.js';

export interface StateSensorConfig {
  power?: boolean;
  playing?: boolean;
  active?: boolean;
}

type SensorKey = 'power' | 'active';

const SENSOR_LABELS: Record<SensorKey, string> = {
  power: 'Power',
  active: 'Active',
};

export class StateSensorAccessory {
  private readonly services = new Map<SensorKey, Service>();
  private readonly unsubscribe: () => void;
  private cachedStatus: PlayStatus = { state: 'off', playtime: 0, duration: 0 };

  constructor(
    private readonly platform: PanaBridgePlatform,
    private readonly accessory: PlatformAccessory,
    private readonly device: PanasonicBD,
    sensors: StateSensorConfig,
  ) {
    this.accessory.getService(this.platform.api.hap.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.api.hap.Characteristic.Manufacturer, 'Panasonic')
      .setCharacteristic(this.platform.api.hap.Characteristic.Model, 'Blu-Ray')
      .setCharacteristic(this.platform.api.hap.Characteristic.SerialNumber, accessory.context.device?.host ?? 'N/A');

    const enabled: SensorKey[] = (['power', 'active'] as SensorKey[]).filter((k) => sensors[k]);
    const enabledSet = new Set<string>(enabled);

    const Sensor = this.platform.api.hap.Service.OccupancySensor;
    for (const service of [...this.accessory.services]) {
      if (service.UUID === Sensor.UUID && service.subtype && !enabledSet.has(service.subtype)) {
        this.accessory.removeService(service);
      }
    }

    for (const key of enabled) {
      const label = SENSOR_LABELS[key];
      const existing = this.accessory.getServiceById(Sensor, key);
      const service = existing ?? this.accessory.addService(Sensor, label, key);
      service.setCharacteristic(this.platform.api.hap.Characteristic.Name, label);
      service.setCharacteristic(this.platform.api.hap.Characteristic.ConfiguredName, label);
      const char = service.getCharacteristic(this.platform.api.hap.Characteristic.OccupancyDetected);
      char.removeAllListeners('get');
      char.onGet(() => this.evaluate(key, this.cachedStatus.state));
      this.services.set(key, service);
    }

    this.unsubscribe = this.device.onStatusUpdate((status) => this.onStatusUpdate(status));
  }

  private evaluate(key: SensorKey, state: PlayState): boolean {
    if (state === 'error') {
      return false;
    }
    if (key === 'power') {
      return state !== 'off' && state !== 'standby';
    }
    return state === 'playing' || state === 'unknown';
  }

  private onStatusUpdate(status: PlayStatus): void {
    if (status.state === 'error') {
      return;
    }
    const prev = this.cachedStatus;
    this.cachedStatus = status;
    const Characteristic = this.platform.api.hap.Characteristic;
    for (const [key, service] of this.services) {
      const next = this.evaluate(key, status.state);
      const before = this.evaluate(key, prev.state);
      if (next !== before) {
        service.updateCharacteristic(Characteristic.OccupancyDetected, next);
      }
    }
  }

  stop(): void {
    this.unsubscribe();
  }
}
