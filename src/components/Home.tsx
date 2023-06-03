export const Home: FC = (_, {animate}) => {
    return <nn-home ref={animate({out: {scale: 0.8}})}><h1>Home</h1></nn-home>
};