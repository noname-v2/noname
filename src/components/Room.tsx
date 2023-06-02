export const Room: FC = (_, {animate}) => {
    return <nn-room ref={animate({fade: {out: {translate: 100}}})}><h1>Room {_.fade}</h1></nn-room>
};