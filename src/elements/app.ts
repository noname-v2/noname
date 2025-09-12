/*
 * Gallery element.
 */
const ext: ElementExtension = _ => ({
    App: {
        created() {
            console.log('Gallery created');
        }
    }
});

export default ext;