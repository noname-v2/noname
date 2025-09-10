/*
 * Card object.
 */
const ext: Extension = ({ entities }) => ({
    Card: class extends entities.Entity {}
});

export default ext;