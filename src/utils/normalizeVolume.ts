interface VolumeConfig {
  host: string;
  container: string;
  mode?: string;
}

export function normalizeVolume(volumeString: string): VolumeConfig {
  // Split volume string into parts
  const parts = volumeString.split(':');
  
  // Replace environment variables with safe defaults
  const normalizeHostPath = (path: string): string => {
    // Replace $HOME, ${HOME}, ~/ with ./
    return path
      .replace(/\$HOME/g, '.')
      .replace(/\${HOME}/g, '.')
      .replace(/^~\//, './');
  };

  if (parts.length === 1) {
    // Single path - use as both host and container path
    const normalizedPath = normalizeHostPath(parts[0]);
    return {
      host: normalizedPath,
      container: normalizedPath
    };
  } else if (parts.length === 2) {
    // Host:Container format
    return {
      host: normalizeHostPath(parts[0]),
      container: parts[1]
    };
  } else {
    // Host:Container:Mode format
    return {
      host: normalizeHostPath(parts[0]),
      container: parts[1],
      mode: parts[2]
    };
  }
}
