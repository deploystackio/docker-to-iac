export function parseCommand(command: string | string[] | undefined): string {
  if (!command) {
    return '';
  }

  if (Array.isArray(command)) {
    return command.join(' ');
  }

  return command.toString();
}
