export default {
    Arena: (_, {animate, ref}) => {
        animate({
            in: [{translate: [0, 50]}, {}]
        });
    
        return <nn-arena ref={ref()}><h1>Arena</h1></nn-arena>
    }
} as FCM;