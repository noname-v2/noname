import Logger from '../logger';
import Channel from './channel';
import Library from './library';
import Tree from './tree';
import { apply, isDict } from '../utils';
import { getStyleString } from './css';
import { StageStatus } from './stage';
import type Stage from './stage';
import type { RemoteClient, ChannelName } from './channel';

export default class Server extends Logger {
    // Default channel type
    type: ChannelName = 'worker';

    // Server options
    #options: ServerOptions;

    // Pre-computed style string for all clients
    #css!: string;

    // Communication channel with clients
    #channel = new Channel();

    // Connected clients
    #clients = new Map<string, RemoteClient>();

    // Library managing entity definitions
    #lib = new Library(this);

    // Virtual DOM tree
    #tree = new Tree(this, this.#lib);

    // Current running stage
    #stage!: Stage;

    // Expose objects useful for entities
    get ui() { return this.#tree.ui; }

    constructor(public options: ServerOptions = {}) {
        super(options.debug);
        this.#options = options;
        if (options.debug) {
            apply(this as any, {
                tree: this.#tree,
                clients: this.#clients,
                options: this.#options,
            });
        }

        // Handle new client connections
        this.#channel.on('open', (client) => {
            this.log('Client connected', client.id);
            // Give client 10s to identify itself before closing connection
            setTimeout(() => {
                if (!this.#clients.has(client.id)) {
                    this.log('Client failed to identify, disconnecting', client.id);
                    client.close();
                }
            }, 10000);
        });

        // Handle client messages
        this.#channel.on('message', (client, msg) => {
            this.log('Message from', client.id, msg);
            if (msg === 'init') {
                this.#clients.set(client.id, client);
                this.#tree.init(client.id, this.#css);
            }
        });
    }

    // Start the server
    start() {
        // Add a default client if none exists
        this.log('Server started');

        // Add channels
        this.#channel.add(this.#options.channel || this.type);

        // Initialize the root stage and component
        this.#tree.createRoot(this.ui.app());
        this.#css = getStyleString(this.#lib.refs('component'));

        // Create root stage
        this.#execute(this.#lib.create('stage', 'app'))
        // from here: load state, etc.
    }

    // Send data to a client
    send(id: string, data: any) {
        this.#clients.get(id)?.send(data);
    }

    // Send data to all clients
    broadcast(data: any) {
        this.#clients.forEach(client => client.send(data));
    }

    // Add and run a child stage
    async next(tag: string, arg?: Dict): Promise<Dict> {
        const lib = this.#lib;
        const stage = this.#stage;
        const step = lib.get(stage, 'step');
        let result: Dict;
        const current = lib.get(stage, 'running')[step];
        if (lib.tag(current) === tag) {
            // Child stage matches a saved child stage
            // Return result directly if child execution finished, otherwise call this.#execute()
            result = current.done ? current.result : await this.#execute(current);
        }
        else {
            // Create a new child stage
            const child = lib.create('stage', tag, stage, stage, arg);
            const running = lib.get(stage, 'running');
            running.length = step; // Discard any unmatched child stages after current step
            running.push(child);
            result = await this.#execute(child);
        }
        this.#stage = stage; // restore current stage
        lib.set(stage, 'step', step + 1);
        return result;
    }

    // Progress on step for the stage
    async #execute(stage: Stage) {
        this.#stage = stage;
        const lib = this.#lib;
        const ref = lib.ref(stage) as StageDefinition;
        let status = lib.get(stage, 'status');
        while (status < StageStatus.Done) { // while not done
            this.log('Executing', lib.tag(stage), stage.status, lib.get(stage, 'executing') ?? '', lib.get(stage, 'toExecute') ?? '');
            if (status === StageStatus.Main) { // main
                const exec = lib.get(stage, 'executing') ?? 'main';
                const result = await ref[exec].call(stage);
                if (typeof result === 'string') {
                    // Create and execute a child stage
                    if (exec === 'main') {
                        status = StageStatus.None;
                        lib.set(stage, 'executing', result);
                    }
                    else {
                        lib.set(stage, 'toExecute', result);
                    }
                }
                else if (isDict(result)) {
                    // Main execution finished with result
                    lib.set(stage, 'result', result);
                }
            }
            else if (status > StageStatus.None) {
                // Trigger `before`, `begin`, `end`, `after`
                await this.#trigger();
                if (status === StageStatus.After) {
                    const toExecute = lib.get(stage, 'toExecute');
                    if (toExecute) {
                        // Execute the function specified by toExecute
                        lib.set(stage, 'executing', toExecute);
                        lib.set(stage, 'toExecute');
                        status = StageStatus.None;
                    }
                    else if (lib.get(stage, 'executing')) {
                        // Finished executing child stages, trigger `end` and `after` for main
                        lib.set(stage, 'executing');
                        status = StageStatus.Main;
                    }
                }
            }
            this.#flush();
            lib.set(stage, 'status', ++status);
        }
        return stage.result ?? {} as Dict;
    }

    // Trigger events in the current stage
    async #trigger() {

    }

    // Flatten and move stages in running to history
    #flush() {
        const history = this.#lib.get(this.#stage, 'history');
        const running = this.#lib.get(this.#stage, 'running');
        for (const child of running) {
            history.push(this.#flatten(child));
        }
        running.length = 0;
    }

    // Flatten Stage for saving in history
    #flatten(_: Stage): Dict<Plain> {
        const obj = {};
        this.log('Flattened stage', obj);
        return obj;
    }
}