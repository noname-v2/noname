export const App: FC = ({ page, $page }, UI, { reply, refresh }) => {
    const map: {[key: string]: (fade: 'in' | 'out') => JSX.Element} = {
        arena: fade => <UI.Arena fade={fade} />,
        room: fade => <UI.Room fade={fade} />,
        splash: fade => <UI.Splash fade={fade} />
    };

    if ($page) {
        refresh();
    }

    return <nn-app onClick={() => {
        if (page === 'splash') reply('room');
        else if (page === 'room') reply('arena');
        else if (page === 'arena') reply('splash')
        else alert('error');
    }}>
        <UI.Zoom cid='app-zoom'>
            <UI.Foreground cid='app-fg' />
            {page ? map[page]('in') : ''}
            {$page ? map[$page]('out') : ''}
            <UI.Background cid='app-bg'/>
        </UI.Zoom>
    </nn-app>
};