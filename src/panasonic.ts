import * as http from 'http';

type RawResponse = ['ok' | 'error' | 'off', string[] | null];

const HEADERS = {
  'User-Agent': 'MEI-LAN-REMOTE-CALL',
  'Content-Type': 'application/x-www-form-urlencoded',
};

export type PlayState = 'off' | 'standby' | 'stopped' | 'playing' | 'paused' | 'unknown' | 'error';

export interface PlayStatus {
  state: PlayState;
  playtime: number;
  duration: number;
}

export type StatusListener = (status: PlayStatus) => void;

export class PanasonicBD {
  private _host: string;
  private _variant: 'AUTO' | 'BD' | 'UB';
  private _debug: (msg: string) => void;
  private _listeners: Set<StatusListener> = new Set();
  private _pollTimer: NodeJS.Timeout | null = null;
  private _polling = false;
  private _stopRequested = false;
  private _lastStatus: PlayStatus | null = null;

  constructor(host: string, debug: (msg: string) => void = () => {}, variant: 'AUTO' | 'BD' | 'UB' = 'AUTO') {
    this._host = host;
    this._debug = debug;
    this._variant = variant;
  }

  get lastStatus(): PlayStatus | null {
    return this._lastStatus;
  }

  onStatusUpdate(listener: StatusListener): () => void {
    this._listeners.add(listener);
    if (this._lastStatus) {
      listener(this._lastStatus);
    }
    return () => {
      this._listeners.delete(listener);
    };
  }

  startPolling(intervalMs: number): void {
    if (this._polling) {
      return;
    }
    this._polling = true;
    this._stopRequested = false;
    const loop = async () => {
      while (!this._stopRequested) {
        try {
          const status = await this.getPlayStatus();
          this._lastStatus = status;
          for (const l of this._listeners) {
            try {
              l(status);
            } catch {
              // listener errors must not break the poll loop
            }
          }
        } catch {
          // network errors are surfaced as state 'off' or 'error' inside getPlayStatus
        }
        if (this._stopRequested) {
          break;
        }
        await new Promise<void>((resolve) => {
          this._pollTimer = setTimeout(resolve, intervalMs);
        });
      }
      this._polling = false;
      this._pollTimer = null;
    };
    loop();
  }

  stopPolling(): void {
    this._stopRequested = true;
    if (this._pollTimer) {
      clearTimeout(this._pollTimer);
      this._pollTimer = null;
    }
  }

  private sendCmd(url: string, data: string): Promise<RawResponse> {
    return new Promise((resolve) => {
      const options = {
        method: 'POST',
        timeout: 5000,
        headers: {
          ...HEADERS,
          'Content-Length': Buffer.byteLength(data),
        },
      };
      const req = http.request(url, options, (res) => {
        let rawData = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          rawData += chunk;
        });
        res.on('end', () => {
          this._debug(`HTTP ${res.statusCode} ${data} -> ${JSON.stringify(rawData)}`);
          const lines = rawData.split(/\r?\n/).filter((l) => l.length > 0);
          if (lines.length === 0) {
            resolve(['error', null]);
            return;
          }
          const firstLine = lines[0].split(',')[0];
          if (firstLine !== '00') {
            resolve(['error', null]);
          } else {
            const dataLine = lines[1] ?? '';
            resolve(['ok', dataLine.split(',')]);
          }
        });
      });
      req.on('error', () => {
        resolve(['off', null]);
      });
      req.on('timeout', () => {
        req.destroy();
        resolve(['off', null]);
      });
      req.write(data);
      req.end();
    });
  }

  async sendCommand(key: string): Promise<boolean> {
    const url = `http://${this._host}/WAN/dvdr/dvdr_ctrl.cgi`;
    const data = `cCMD_RC_${key}.x=100&cCMD_RC_${key}.y=100`;
    const resp = await this.sendCmd(url, data);
    return resp[0] === 'ok';
  }

  private async getStatus(): Promise<string[] | 'error' | 'off'> {
    if (this._variant === 'UB') {
      return ['1', '0', '0', '00000000', '0'];
    }
    const url = `http://${this._host}/WAN/dvdr/dvdr_ctrl.cgi`;
    const data = 'cCMD_GET_STATUS.x=100&cCMD_GET_STATUS.y=100';
    const resp = await this.sendCmd(url, data);
    if (resp[0] === 'error') {
      if (this._variant === 'AUTO') {
        this._variant = 'UB';
        return ['1', '0', '0', '00000000', '0'];
      }
      return 'error';
    }
    if (resp[0] === 'off') {
      return 'off';
    }
    if (this._variant === 'AUTO') {
      this._variant = 'BD';
    }
    return resp[1] as string[];
  }

  async getPlayStatus(): Promise<PlayStatus> {
    const url = `http://${this._host}/WAN/dvdr/dvdr_ctrl.cgi`;
    const data = 'cCMD_PST.x=100&cCMD_PST.y=100';
    const resp = await this.sendCmd(url, data);
    if (resp[0] === 'off') {
      return { state: 'off', playtime: 0, duration: 0 };
    }
    if (resp[0] === 'error') {
      return { state: 'error', playtime: 0, duration: 0 };
    }
    const status = await this.getStatus();
    if (status === 'off') {
      return { state: 'off', playtime: 0, duration: 0 };
    }
    if (status === 'error') {
      return { state: 'error', playtime: 0, duration: 0 };
    }
    const stateResponse = resp[1];
    if (stateResponse === null) {
      return { state: 'error', playtime: 0, duration: 0 };
    }
    let state: PlayState;
    if (stateResponse[0] === '0') {
      state = status[0] === '0' ? 'standby' : 'stopped';
    } else if (stateResponse[0] === '1') {
      state = 'playing';
    } else if (stateResponse[0] === '2') {
      state = 'paused';
    } else {
      state = 'unknown';
    }
    const playtime = parseInt(stateResponse[1], 10) || 0;
    const duration = parseInt(status[4], 10) || 0;
    return { state, playtime, duration };
  }
}
