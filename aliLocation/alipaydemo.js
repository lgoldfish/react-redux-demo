// import aliLocation from "../locore"
// console.log(aliLocation)
aliLocation.init({
    debug:false,
    uuids:["FDA50693-A4E2-4FB1-AFCF-C6EB07647825"],
    port:40010
})
aliLocation.start()
setInterval(function() {
    var data = aliLocation.getLocation();
    document.getElementById("locations").innerText=JSON.stringify(data)
    //在这里添加你的逻辑
  }, 1000);
  aliLocation.orient(function(e) {
    //在这里添加你的逻辑
    document.getElementById("orient").innerText=JSON.stringify(e.angle)
  });
  aliLocation.motion(function(e) {
    if(e){
        document.getElementById("motion").innerText="走"
    }
    else {
        document.getElementById("motion").innerText="停"
    }

  });
