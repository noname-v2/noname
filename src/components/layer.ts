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
    },
    Background: class extends Component {
        static mixin = ['layer'];
    },
    Main: class extends Component {
        static mixin = ['layer'];
    },
    Foreground: class extends Component {
        static mixin = ['layer'];
        static css = {
            pointerEvents: 'none' // make sure foreground does not block interactions
        };
    }
});

export default ext;