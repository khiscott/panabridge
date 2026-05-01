export const COMMAND_RESET_DELAY_MS = 250;
export const POLL_INTERVAL_MS = 5000;

export interface CommandDefinition {
  key: string;
  label: string;
  defaultGroup: string;
}

export const COMMANDS: CommandDefinition[] = [
  { key: 'POWERON', label: 'Power On', defaultGroup: 'Power' },
  { key: 'POWEROFF', label: 'Power Off', defaultGroup: 'Power' },
  { key: 'OP_CL', label: 'Eject / Close', defaultGroup: 'Power' },

  { key: 'PLAYBACK', label: 'Play', defaultGroup: 'Transport' },
  { key: 'PAUSE', label: 'Pause', defaultGroup: 'Transport' },
  { key: 'STOP', label: 'Stop', defaultGroup: 'Transport' },
  { key: 'SKIPFWD', label: 'Skip Forward', defaultGroup: 'Transport' },
  { key: 'SKIPREV', label: 'Skip Back', defaultGroup: 'Transport' },
  { key: 'CUE', label: 'Fast Forward', defaultGroup: 'Transport' },
  { key: 'REV', label: 'Rewind', defaultGroup: 'Transport' },
  { key: 'MNSKIP', label: 'Skip +60s', defaultGroup: 'Transport' },
  { key: 'MNBACK', label: 'Skip -10s', defaultGroup: 'Transport' },

  { key: 'SHFWD1', label: 'Step Fwd 1', defaultGroup: 'Step' },
  { key: 'SHFWD2', label: 'Step Fwd 2', defaultGroup: 'Step' },
  { key: 'SHFWD3', label: 'Step Fwd 3', defaultGroup: 'Step' },
  { key: 'SHFWD4', label: 'Step Fwd 4', defaultGroup: 'Step' },
  { key: 'SHFWD5', label: 'Step Fwd 5', defaultGroup: 'Step' },
  { key: 'SHREV1', label: 'Step Rev 1', defaultGroup: 'Step' },
  { key: 'SHREV2', label: 'Step Rev 2', defaultGroup: 'Step' },
  { key: 'SHREV3', label: 'Step Rev 3', defaultGroup: 'Step' },
  { key: 'SHREV4', label: 'Step Rev 4', defaultGroup: 'Step' },
  { key: 'SHREV5', label: 'Step Rev 5', defaultGroup: 'Step' },
  { key: 'JLEFT', label: 'Jog Left', defaultGroup: 'Step' },
  { key: 'JRIGHT', label: 'Jog Right', defaultGroup: 'Step' },

  { key: 'UP', label: 'Up', defaultGroup: 'Navigation' },
  { key: 'DOWN', label: 'Down', defaultGroup: 'Navigation' },
  { key: 'LEFT', label: 'Left', defaultGroup: 'Navigation' },
  { key: 'RIGHT', label: 'Right', defaultGroup: 'Navigation' },
  { key: 'SELECT', label: 'Select', defaultGroup: 'Navigation' },
  { key: 'RETURN', label: 'Return', defaultGroup: 'Navigation' },
  { key: 'EXIT', label: 'Exit', defaultGroup: 'Navigation' },

  { key: 'MLTNAVI', label: 'Home', defaultGroup: 'Menu' },
  { key: 'MENU', label: 'Menu', defaultGroup: 'Menu' },
  { key: 'TITLE', label: 'Title Menu', defaultGroup: 'Menu' },
  { key: 'PUPMENU', label: 'Popup Menu', defaultGroup: 'Menu' },
  { key: 'DSPSEL', label: 'Status Display', defaultGroup: 'Menu' },

  { key: 'RED', label: 'Red', defaultGroup: 'Color Buttons' },
  { key: 'GREEN', label: 'Green', defaultGroup: 'Color Buttons' },
  { key: 'BLUE', label: 'Blue', defaultGroup: 'Color Buttons' },
  { key: 'YELLOW', label: 'Yellow', defaultGroup: 'Color Buttons' },

  { key: 'AUDIOSEL', label: 'Audio Language', defaultGroup: 'Audio & Subs' },
  { key: 'TITLEONOFF', label: 'Subtitle Toggle', defaultGroup: 'Audio & Subs' },
  { key: 'CLOSED_CAPTION', label: 'Closed Caption', defaultGroup: 'Audio & Subs' },
  { key: 'SOUNDEFFECT', label: 'Sound Effect', defaultGroup: 'Audio & Subs' },
  { key: '2NDARY', label: 'Secondary Audio', defaultGroup: 'Audio & Subs' },

  { key: 'RESOLUTN', label: 'Resolution', defaultGroup: 'Picture' },
  { key: 'HDR_PICTUREMODE', label: 'HDR Picture Mode', defaultGroup: 'Picture' },
  { key: 'PICTURESETTINGS', label: 'Picture Settings', defaultGroup: 'Picture' },
  { key: 'OSDONOFF', label: 'OSD On/Off', defaultGroup: 'Picture' },
  { key: 'P_IN_P', label: 'Picture in Picture', defaultGroup: 'Picture' },
  { key: 'CHROMA', label: 'Chroma', defaultGroup: 'Picture' },
  { key: 'HIGHCLARITY', label: 'High Clarity', defaultGroup: 'Picture' },
  { key: 'PICTMD', label: 'Picture Mode', defaultGroup: 'Picture' },
  { key: 'DETAIL', label: 'Detail', defaultGroup: 'Picture' },

  { key: 'PLAYBACKINFO', label: 'Playback Info', defaultGroup: 'Info' },
  { key: 'SKIP_THE_TRAILER', label: 'Skip Trailer', defaultGroup: 'Info' },
  { key: '3D', label: '3D', defaultGroup: 'Info' },
  { key: 'KEYS', label: 'Keys', defaultGroup: 'Info' },

  { key: 'NETFLIX', label: 'Netflix', defaultGroup: 'Streaming' },
  { key: 'NETWORK', label: 'Network', defaultGroup: 'Streaming' },
  { key: 'MIRACAST', label: 'Mirroring', defaultGroup: 'Streaming' },

  { key: 'D0', label: '0', defaultGroup: 'Digits' },
  { key: 'D1', label: '1', defaultGroup: 'Digits' },
  { key: 'D2', label: '2', defaultGroup: 'Digits' },
  { key: 'D3', label: '3', defaultGroup: 'Digits' },
  { key: 'D4', label: '4', defaultGroup: 'Digits' },
  { key: 'D5', label: '5', defaultGroup: 'Digits' },
  { key: 'D6', label: '6', defaultGroup: 'Digits' },
  { key: 'D7', label: '7', defaultGroup: 'Digits' },
  { key: 'D8', label: '8', defaultGroup: 'Digits' },
  { key: 'D9', label: '9', defaultGroup: 'Digits' },
  { key: 'D12', label: '12', defaultGroup: 'Digits' },
  { key: 'SHARP', label: '#', defaultGroup: 'Digits' },
  { key: 'CLEAR', label: 'Clear / Cancel', defaultGroup: 'Digits' },
];

export const COMMAND_MAP: Map<string, CommandDefinition> = new Map(
  COMMANDS.map((c) => [c.key, c]),
);

export const STATEFUL_COMMANDS = ['POWER', 'PLAYBACK'];
