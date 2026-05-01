import type { API, DynamicPlatformPlugin, Logging, PlatformAccessory, PlatformConfig } from 'homebridge';

import { PanasonicPlatformAccessory } from './platformAccessory.js';
import { PanasonicBD } from './panasonic.js';
import { CommandSwitchAccessory, type CommandSwitchConfig } from './commandSwitchAccessory.js';
import { StateSensorAccessory, type StateSensorConfig } from './stateSensorAccessory.js';
import { COMMAND_MAP, POLL_INTERVAL_MS } from './commands.js';
import { PLATFORM_NAME, PLUGIN_NAME } from './settings.js';

interface GroupConfig {
  name: string;
  commands: string[];
}

export class PanaBridgePlatform implements DynamicPlatformPlugin {
  public readonly accessories: Map<string, PlatformAccessory> = new Map();
  public readonly discoveredCacheUUIDs: string[] = [];
  private device: PanasonicBD | null = null;

  constructor(
    public readonly log: Logging,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.log.debug('Finished initializing platform:', this.config.name);

    this.api.on('didFinishLaunching', () => {
      this.log.debug('Executed didFinishLaunching callback');
      this.discoverDevices();
    });

    this.api.on('shutdown', () => {
      this.device?.stopPolling();
    });
  }

  configureAccessory(accessory: PlatformAccessory) {
    this.log.info('Loading accessory from cache:', accessory.displayName);
    this.accessories.set(accessory.UUID, accessory);
  }

  discoverDevices() {
    if (!this.config.host) {
      this.log.warn('No host configured; nothing to do.');
      return;
    }

    const host = this.config.host as string;
    const pollInterval = (this.config.pollInterval as number | undefined) ?? POLL_INTERVAL_MS;
    this.device = new PanasonicBD(host, (msg) => {
      if (this.config.debug) {
        this.log.debug(msg);
      }
    });

    const sensors = (this.config.sensors as StateSensorConfig | undefined) ?? {};
    const playingEnabled = sensors.playing !== false;

    if (playingEnabled) {
      this.registerLegacySensorAccessory(host);
    }

    if (sensors.power || sensors.active) {
      this.registerStateSensorAccessory(host, sensors);
    }

    const groups = (this.config.groups as GroupConfig[] | undefined) ?? [];
    for (const group of groups) {
      this.registerGroupAccessory(host, group);
    }

    for (const [uuid, accessory] of this.accessories) {
      if (!this.discoveredCacheUUIDs.includes(uuid)) {
        this.log.info('Removing existing accessory from cache:', accessory.displayName);
        this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
      }
    }

    this.device.startPolling(pollInterval);
  }

  private registerLegacySensorAccessory(host: string): void {
    const device = {
      uniqueId: host,
      displayName: 'Panasonic Blu-ray player',
      host,
    };
    const uuid = this.api.hap.uuid.generate(device.uniqueId);
    const existing = this.accessories.get(uuid);

    if (existing) {
      this.log.info('Restoring existing accessory from cache:', existing.displayName);
      new PanasonicPlatformAccessory(this, existing, this.device!);
    } else {
      this.log.info('Adding new accessory:', device.displayName);
      const accessory = new this.api.platformAccessory(device.displayName, uuid);
      accessory.context.device = device;
      new PanasonicPlatformAccessory(this, accessory, this.device!);
      this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
    }
    this.discoveredCacheUUIDs.push(uuid);
  }

  private registerStateSensorAccessory(host: string, sensors: StateSensorConfig): void {
    const displayName = 'Panasonic Blu-ray State';
    const uuid = this.api.hap.uuid.generate(`${host}-state-sensors`);
    const existing = this.accessories.get(uuid);

    if (existing) {
      this.log.info('Restoring state sensors from cache:', existing.displayName);
      new StateSensorAccessory(this, existing, this.device!, sensors);
    } else {
      this.log.info('Adding new state sensors:', displayName);
      const accessory = new this.api.platformAccessory(displayName, uuid);
      accessory.context.device = { host, displayName };
      new StateSensorAccessory(this, accessory, this.device!, sensors);
      this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
    }
    this.discoveredCacheUUIDs.push(uuid);
  }

  private registerGroupAccessory(host: string, group: GroupConfig): void {
    if (!group.name || !Array.isArray(group.commands) || group.commands.length === 0) {
      return;
    }

    const commands: CommandSwitchConfig[] = group.commands
      .map((key) => {
        const def = COMMAND_MAP.get(key);
        if (!def) {
          this.log.warn(`Unknown command "${key}" in group "${group.name}" — skipping`);
          return null;
        }
        return { name: def.label, commandKey: def.key };
      })
      .filter((c): c is CommandSwitchConfig => c !== null);

    if (commands.length === 0) {
      return;
    }

    const uuid = this.api.hap.uuid.generate(`${host}-${group.name}`);
    const existing = this.accessories.get(uuid);

    if (existing) {
      this.log.info(`Restoring group accessory "${group.name}" from cache`);
      existing.displayName = group.name;
      new CommandSwitchAccessory(this, existing, this.device!, commands);
    } else {
      this.log.info(`Adding new group accessory: ${group.name}`);
      const accessory = new this.api.platformAccessory(group.name, uuid);
      accessory.context.device = { host, displayName: group.name };
      new CommandSwitchAccessory(this, accessory, this.device!, commands);
      this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
    }
    this.discoveredCacheUUIDs.push(uuid);
  }
}
