/**
 * Detects various database URL formats and extracts the host/service name
 */
export function detectDatabaseUrl(value: string): { 
  type: 'postgresql' | 'mysql' | 'redis' | 'mongodb' | 'unknown',
  host: string,
  port: string,
  database: string
} | null {
  // PostgreSQL format: postgresql://username:password@hostname:port/database
  const pgMatch = value.match(/postgresql:\/\/.*:.*@([^:]+):(\d+)\/([^?]+)/);
  if (pgMatch) {
    return {
      type: 'postgresql',
      host: pgMatch[1],
      port: pgMatch[2],
      database: pgMatch[3]
    };
  }
  
  // MySQL format: mysql://username:password@hostname:port/database
  const mysqlMatch = value.match(/mysql:\/\/.*:.*@([^:]+):(\d+)\/([^?]+)/);
  if (mysqlMatch) {
    return {
      type: 'mysql',
      host: mysqlMatch[1],
      port: mysqlMatch[2],
      database: mysqlMatch[3]
    };
  }
  
  // Redis format: redis://username:password@hostname:port
  const redisMatch = value.match(/redis:\/\/.*:.*@([^:]+):(\d+)/);
  if (redisMatch) {
    return {
      type: 'redis',
      host: redisMatch[1],
      port: redisMatch[2],
      database: ''  // Redis doesn't have database names in the same way
    };
  }
  
  // MongoDB format: mongodb://username:password@hostname:port/database
  const mongoMatch = value.match(/mongodb:\/\/.*:.*@([^:]+):(\d+)\/([^?]+)/);
  if (mongoMatch) {
    return {
      type: 'mongodb',
      host: mongoMatch[1],
      port: mongoMatch[2],
      database: mongoMatch[3]
    };
  }
  
  return null;
}
