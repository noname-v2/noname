export const App: FC = ({ page, $page }, { Arena, Room, Home, Zoom, Foreground, Main, Background, refresh, reply }) => {
    const main = (p: string, a: 'in' | 'out') => {
        if (p === 'arena') return <Arena cid='arena' state={a=='in'?'jump':a} />;
        if (p === 'room') return <Room cid='room' state={a} />;
        if (p === 'home') return <Home cid='home' state={a} />;
        return '';
    }

    if ($page) {
        refresh();
    }

    return <nn-app onClick={() => {
        if (page === 'home') reply('room');
        else if (page === 'room') reply('arena');
        else if (page === 'arena') reply('home')
    }}>
        <Zoom>
            <Foreground cid='app-fg' />
            <Main>
                {main($page, 'out')}
                {main(page, 'in')}
            </Main>
            <Background cid='app-bg'/>
        </Zoom>
    </nn-app>
};

// from here: ref={animate()} -> ref={bind()}