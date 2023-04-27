export const App: FC = ({owner, page}, UI) => {
    return <nn-app>
        <UI.Zoom>
            <UI.Foreground cid='app-fg' />
            {owner}
            {page === 'arena' ? <UI.Arena /> : page === 'room' ? <UI.Room /> : <UI.Splash />}
            <UI.Background cid='app-bg'/>
        </UI.Zoom>
    </nn-app>
};