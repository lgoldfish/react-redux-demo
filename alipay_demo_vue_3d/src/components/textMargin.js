export default function setPriority(mapView, arr) {
    if(!mapView) {
        return ;
    }
console.log("mapView is",mapView)
    for(let i=0; i<arr.length; i++) {
        const features = mapView.getLayer(mapView.currentfloor).getLayer(arr[i].key).features.features;
        const filterList = arr[i].value;
        for(let j=0; j<features.length; j++) {
            for(let m=0; m<filterList.length; m++) {
                if(filterList[m].key === 'other') {
                    features[j].priority = filterList[m].value;
                } else if(features[j].properties.englishName === filterList[m].key) {
                    features[j].priority = filterList[m].value;
                }
            }
        }
    }
}