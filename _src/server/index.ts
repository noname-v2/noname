/**
 * This file will be copied to <platform>/_server.js for each platform
 * to initialize their custom Server object and is not intended to be used directly.
 */
import Server from './server';

const server = new Server();
server.start();