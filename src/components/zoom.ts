const ext: Extension = ({ Component }) => ({
    Zoom: class extends Component {
        static mixin = ['layer'];
    }
});

export default ext;