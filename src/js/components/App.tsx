export const App: FC = ({ owner, page }, UI, { reply }) => {
    return <nn-app onClick={() => {
        reply('room');
    }}>
        <UI.Zoom>
            <UI.Foreground cid='app-fg' />
            {owner}
            {page === 'arena' ? <UI.Arena /> : page === 'room' ? <UI.Room /> : <UI.Splash />}
            <UI.Background cid='app-bg'/>
        </UI.Zoom>
    </nn-app>
};