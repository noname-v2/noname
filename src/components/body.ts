const ext: Extension = ({ Component }) => ({
    Body: class extends Component {
        static native = true;
        static mixin = ['layer'];
    }
});

export default ext;