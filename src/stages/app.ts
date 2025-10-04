export default {
    stage: {
        app: {
            run() {
                // this.test();
            },
            sub: {
                a: {
                    run() {
                        // this.check()
                    }
                }
            }
        },
    }
} as Extension;