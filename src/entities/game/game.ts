const ext: Extension = ({ entities }) => ({
    Game: class extends entities.Entity {}
});

export default ext;