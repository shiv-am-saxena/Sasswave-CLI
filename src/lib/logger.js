import chalk from 'chalk';

// Lightweight logger so helpers can emit consistent CLI-prefixed output.
export function log(...args) {
    console.log(chalk.blue('[sasswave]'), ...args);
}
