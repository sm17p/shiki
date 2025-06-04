import { warn, debug, trace, info, error } from '@tauri-apps/plugin-log';

// call detach() if you do not want to print logs to the console anymore
function forwardConsole(
  fnName: 'log' | 'debug' | 'info' | 'warn' | 'error',
  logger: (message: string) => Promise<void>
) {
  const original = console[fnName];
  console[fnName] = (...args) => {
    original(...args);
    logger(args.join(' '));
  };
}



export const init = async () => {
    forwardConsole('log', trace);
    forwardConsole('debug', debug);
    forwardConsole('info', info);
    forwardConsole('warn', warn);
    forwardConsole('error', error);
};