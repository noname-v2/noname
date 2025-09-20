const ext: Extension = ({ Component }) => ({
    Layer: class extends Component {
        static css = {
            width: '100%',
            height: '100%',
            position: 'absolute',
            top: '0',
            left: '0',
            overflow: 'hidden',
            margin: '0',
            padding: '0'
        };
    }
});

export default ext;