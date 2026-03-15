/**
 * This file will be copied to <platform>/_client.js for each platform
 * to initialize their custom Client object and is not intended to be used directly.
 */
import Client from './client';

const client = new Client();
client.start();