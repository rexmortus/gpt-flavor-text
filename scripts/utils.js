
import { moduleName } from './settings.js';
/** UTILITY FUNCTIONS **/

// Standardised console logging to allow us to filter console messages from this module
export function log(msg = '', ...objs) {
    console.log(`${moduleName} | ${msg}`, objs);
}

// Standardised/formatted error logging to specify errors from this module
export function logError(msg = '', e = null) {
    console.error(`${moduleName} | ${msg ?? '<No error details available>'}`, e)
}

// Standardised/formatted debug logging of a message and/or any number of objects
export function logDebug(msg = '', ...objs) {
    console.debug(`${moduleName} | ${msg}`, objs);
}