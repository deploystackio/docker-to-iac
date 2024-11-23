interface PortConfig {
  target?: number;
  published?: number;
  protocol?: string;
  mode?: string;
}

export function parsePort(portValue: string | PortConfig): number | null {
  try {
    // Handle long syntax (object format)
    if (typeof portValue === 'object' && portValue !== null) {
      return portValue.published || portValue.target || null;
    }
    
    // Handle short syntax (string format)
    if (typeof portValue === 'string') {
      // Handle format like "8080:80" or '8080:80' or '8080'
      const parts = portValue.toString().split(':');
      return parseInt(parts[0], 10) || parseInt(parts[1], 10) || null;
    }
    
    return null;
  } catch (error) {
    console.warn(`Error parsing port value: ${portValue}`, error);
    return null;
  }

}
