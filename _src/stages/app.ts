export default {
    stage: {
        app: {
            main() {
                this.server.log('App stage main');
                return 'run';
            },
            run() {
                this.server.log('App stage run');
                return 'run2';
            },
            run2() {
                this.server.log('App stage run2');
            }
        },
    }
} as Extension;