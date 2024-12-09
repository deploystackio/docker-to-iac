interface PortConfig {
  host: number;
  container: number;
  protocol?: string;
}

export function normalizePort(portMapping: string): PortConfig {
  // Remove any IP address prefix if present (e.g., "127.0.0.1:")
  const withoutIp = portMapping.replace(/^\d+\.\d+\.\d+\.\d+:/, '');

  // Handle environment variable with default value format ${VAR:-default}
  const processedPort = withoutIp.replace(/\${[^}]+:-(\d+)}/g, '$1');

  // Extract protocol if present
  let protocol: string | undefined;
  if (processedPort.includes('/')) {
    const [portPart, protocolPart] = processedPort.split('/');
    protocol = protocolPart;
    portMapping = portPart;
  }

  // Split port mapping
  const parts = processedPort.split(':');
  
  if (parts.length > 1) {
    return {
      host: Math.abs(parseInt(parts[0], 10)),
      container: Math.abs(parseInt(parts[1], 10)),
      protocol
    };
  }

  const port = Math.abs(parseInt(parts[0], 10));
  return {
    host: port,
    container: port,
    protocol
  };
}
