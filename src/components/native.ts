const ext: Extension = ({ Component }) => ({
    Body: class extends Component {
        static native = true;
    },
    Div:class extends Component {
        static native = true;
    },
});

export default ext;