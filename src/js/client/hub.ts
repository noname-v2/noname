export const hubState = <{ worker: Worker, asked: number }>{};

export const hub = {
    /**
     * Send result to worker-side hub.ask().
     */
    reply(result: any) {
        hubState.worker.postMessage([hubState.asked, result]);
    },

    /**
     * Send update to worker-side hub.monitor().
     */
    sync() {

    },


    /**
     * Send global messanges (e.g. switch to auto, chat, etc.)
     */
    send() {

    }
}

export type HubType = typeof hub;
