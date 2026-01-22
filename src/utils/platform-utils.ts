/**
 * Platform Detection and Path Mapping Utilities
 *
 * Handles cross-platform compatibility for configuration export and analysis.
 */

export type Platform = 'darwin' | 'linux' | 'windows';

export interface PlatformConfig {
  name: Platform;
  packageManager: string;
  installPrefix: string;
  homeDir: string;
  configDir: string;
  pathSeparator: string;
  shellExt: string;
}

export const PLATFORMS: Record<Platform, PlatformConfig> = {
  darwin: {
    name: 'darwin',
    packageManager: 'brew',
    installPrefix: 'brew install',
    homeDir: '~',
    configDir: '~/Library/Application Support',
    pathSeparator: '/',
    shellExt: 'sh',
  },
  linux: {
    name: 'linux',
    packageManager: 'apt-get',
    installPrefix: 'apt-get install -y',
    homeDir: '/home/$USER',
    configDir: '~/.config',
    pathSeparator: '/',
    shellExt: 'sh',
  },
  windows: {
    name: 'windows',
    packageManager: 'winget',
    installPrefix: 'winget install',
    homeDir: 'C:\\Users\\%USERNAME%',
    configDir: '%APPDATA%',
    pathSeparator: '\\',
    shellExt: 'ps1',
  },
};

/**
 * Detect current platform
 */
export function detectPlatform(): Platform {
  const platform = process.platform;
  if (platform === 'darwin') return 'darwin';
  if (platform === 'win32') return 'windows';
  return 'linux';
}

/**
 * Get platform configuration
 */
export function getPlatformConfig(platform?: Platform): PlatformConfig {
  return PLATFORMS[platform || detectPlatform()];
}

/**
 * Get install command for a tool on target platform
 */
export function getInstallCommand(tool: string, platform: Platform): string {
  const commands: Record<string, Record<Platform, string>> = {
    git: {
      darwin: 'brew install git',
      linux: 'apt-get install -y git',
      windows: 'winget install Git.Git',
    },
    npm: {
      darwin: 'brew install node',
      linux: 'apt-get install -y npm',
      windows: 'winget install OpenJS.NodeJS',
    },
    ffuf: {
      darwin: 'brew install ffuf',
      linux: 'go install github.com/ffuf/ffuf/v2@latest',
      windows: 'go install github.com/ffuf/ffuf/v2@latest',
    },
    nuclei: {
      darwin: 'brew install nuclei',
      linux: 'go install github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest',
      windows: 'go install github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest',
    },
    xcodebuild: {
      darwin: '# xcodebuild comes with Xcode',
      linux: '# xcodebuild not available on Linux',
      windows: '# xcodebuild not available on Windows',
    },
  };

  return commands[tool]?.[platform] || `${PLATFORMS[platform].installPrefix} ${tool}`;
}

/**
 * Check if a tool is platform-specific
 */
export function isToolPlatformSpecific(tool: string): Platform | null {
  if (tool === 'xcodebuild' || tool === 'ios-deploy') return 'darwin';
  if (tool === 'apt-get' || tool === 'dpkg') return 'linux';
  if (tool === 'winget' || tool === 'choco') return 'windows';
  return null;
}
