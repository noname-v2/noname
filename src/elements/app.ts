/*
 * Gallery element.
 */
const ext: ElementExtension = (logger) => ({
    App: {
        created() {
            logger.log('App element created');
        }
    }
});

export default ext;