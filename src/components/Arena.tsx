export const Arena: FC = (_, {animate}) => {
    return <nn-arena ref={animate({
        jump: [{translate: [0, 50]}, {}]
    })}><h1>Arena</h1></nn-arena>
};