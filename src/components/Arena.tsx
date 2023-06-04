export const Arena: FC = (_, {animate, ref}) => {
    animate({
        jump: [{translate: [0, 50]}, {}]
    });

    return <nn-arena ref={ref()}><h1>Arena</h1></nn-arena>
};