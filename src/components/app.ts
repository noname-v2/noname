export default (ui, stages, entities) => ({
    ui: {
        /**
         * App component.
         */
        App: class extends ui.Component {
            render() {
                ui.zoom(
                    ui.background(),
                    ui.main(this.children()),
                    ui.foreground()
                    // from here: automatically add hook for stage change
                    // by capturing which stage properties are accessed during render()
                );
            }
        }
    }
}) as Extension;

// import { registerComponent } from "../server/ui";

// // registerComponent('Background', ui =>
// //     /**
// //     * Background component.
// //     */
// //     class extends ui.Component {
// //         render() {
// //             return ui.div({ style: { position: 'absolute', width: '100%', height: '100%', backgroundColor: 'black' } });
// //         }
// //     }
// );

// registerComponent('App', ui =>
    
// );
