// src/utils/logger.js
const chalk = require('chalk');

class Logger {
  static banner() {
    console.log(chalk.cyan(`
 ╔══════════════════════════════════════════╗
 ║                                          ║
 ║   ${chalk.bold.white('Thres // Essential')}                    ║
 ║   ${chalk.gray('Discord Moderation Bot v1.0.0')}           ║
 ║                                          ║
 ╚══════════════════════════════════════════╝
`));
  }

  static _timestamp() {
    return chalk.gray(`[${new Date().toLocaleTimeString()}]`);
  }

  static info(message) {
    console.log(`${this._timestamp()} ${chalk.blue('INFO')} ${message}`);
  }

  static success(message) {
    console.log(`${this._timestamp()} ${chalk.green('SUCCESS')} ${message}`);
  }

  static warn(message) {
    console.log(`${this._timestamp()} ${chalk.yellow('WARN')} ${message}`);
  }

  static error(message) {
    console.log(`${this._timestamp()} ${chalk.red('ERROR')} ${message}`);
  }

  static command(user, command) {
    console.log(`${this._timestamp()} ${chalk.magenta('CMD')} ${chalk.white(user)} executed ${chalk.cyan(`/${command}`)}`);
  }
}

module.exports = Logger;