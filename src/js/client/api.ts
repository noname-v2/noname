export const state = <{ worker: Worker, asked: number }>{};

export const api = {
    /**
     * Send result to worker-side hub.ask().
     */
    reply(result: any) {
        state.worker.postMessage([state.asked, result]);
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

export type ClientAPI = typeof api;
