export function parseEnvFile(content: string): Record<string, string> {
  const env: Record<string, string> = {};
  
  const lines = content.split('\n');
  
  for (let line of lines) {
    line = line.split('#')[0].trim();
    
    // Skip empty lines
    if (!line) continue;
    
    // Split on first equals sign (to handle values containing =)
    const separatorIndex = line.indexOf('=');
    if (separatorIndex === -1) continue;
    
    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();
    
    if ((value.startsWith('"') && value.endsWith('"')) || 
        (value.startsWith('\'') && value.endsWith('\''))) {
      value = value.slice(1, -1);
    }
    
    if (key) {
      env[key] = value;
    }
  }
  
  return env;
}
