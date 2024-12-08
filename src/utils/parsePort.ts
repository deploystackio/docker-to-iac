import { PortMapping } from '../types/container-config';

export function parsePort(portValue: string | PortMapping): number | null {
  try {
    // Handle object format
    if (typeof portValue === 'object' && portValue !== null) {
      // Support both new and legacy format
      // if ('host' in portValue) {
      //   return portValue.host || null;
      // }
      return portValue.published || portValue.target || null;
    }
    
    // Handle string format
    if (typeof portValue === 'string') {
      // Remove any IP address prefix if present (e.g., "127.0.0.1:")
      const withoutIp = portValue.replace(/^\d+\.\d+\.\d+\.\d+:/, '');
      
      // Split remaining string on colon
      const parts = withoutIp.split(':');
      
      // For format "<host_port>:8765", we want the container port (8765)
      // For format "8080:80", we want the host port (8080)
      // If only one number is present, use that
      if (parts.length > 1) {
        const containerPort = parseInt(parts[parts.length - 1], 10);
        return containerPort || null;
      } else {
        return parseInt(parts[0], 10) || null;
      }
    }
    
    return null;
  } catch (error) {
    console.warn(`Error parsing port value: ${portValue}`, error);
    return null;
  }
}