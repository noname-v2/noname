export const App: FC = ({ page, $page }, UI, { reply, refresh }) => {
    const main = (p: string, fade: 'in' | 'out') => {
        if (p === 'arena') {
            return <UI.Arena fade={fade} />;
        }

        if (p === 'room') {
            return <UI.Room fade={fade} />;
        }

        if (p === 'splash') {
            return <UI.Splash fade={fade} />;
        }

        return '';
    }

    if ($page) {
        refresh();
    }

    return <nn-app onClick={() => {
        if (page === 'splash') reply('room');
        else if (page === 'room') reply('arena');
        else if (page === 'arena') reply('splash')
        else alert('error');
    }}>
        <UI.Zoom>
            <UI.Foreground cid='app-fg' />
            {main(page, 'in')}
            {main($page, 'out')}
            <UI.Background cid='app-bg'/>
        </UI.Zoom>
    </nn-app>
};