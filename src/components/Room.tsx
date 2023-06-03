export const Room: FC = (_, {animate}) => {
    return <nn-room ref={animate({
        in: {scale: 1.2}, out: {translate: 100}, jump: [{translate: [0, 50]}, {}]
    })}><h1>Room {_.fade}</h1></nn-room>
};