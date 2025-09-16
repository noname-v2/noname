/*
 * Gallery element.
 */
const ext: ElementExtension = _ => ({
    App: {
        created() {
            console.log('App element created');
        }
    }
});

export default ext;