export default {
    Home: (_, {animate, ref}) => {
        animate({out: {scale: 0.8}});
    
        return <nn-home ref={ref()}>
            <h1>Home</h1>
        </nn-home>
    }
} as FCM;