<template>
  <div id="app">
    <router-view/>
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
*{
    margin: 0;
    box-sizing: border-box;
}
ul {
    padding: 0;
    margin: 0;
}
ul li {
    list-style: none;
    padding: 0;
    margin: 0;
}
html {
    width: 100%;
    height: 100%;
    overflow: hidden;
}
body {  
    overflow:scroll;  
    width: 100%;
    height: 100%;
} 
#compass img {
    z-index: 10;
    position: fixed;
    width: 40px;
    left: 10px;
    top: 50px;
}
.button_list {
    position: fixed;
    top: 10px;
    width: 100%;
} 
.button_list div {
    display: flex;
    justify-content: space-around;
    width: 100%;
    flex-wrap: wrap;
}
.button_list button {
    padding: 0 8px;
    height: 30px;
    line-height: 30px;
    background: #000000;
    color: #FFFFFF;
    border: 0;
    outline: none;
    margin:5px;
}
.button_list button:active {
    background: #FFFFFF;
    color: #000000;
}
.floorControl {
    position: fixed;
    bottom: 10px;
    z-index: 10;
    display: flex;
    margin: 0 auto;
    left: calc(50% - 60px);
    justify-content: space-between;
}
.floorControl div {
    width: 50px;
    height: 30px;
    background: #000000;
    color: #FFFFFF;
    line-height: 30px;
    text-align: center;
    cursor: pointer;
    border-radius: 4px;
    margin-right: 20px;
}
.showToast {
    position: fixed;
    top: 200px;
    width: 150px;
    height: 30px;
    background-color: #000000;
    color: #FFFFFF;
    border-radius: 8px;
    z-index: 1000;
    line-height: 30px;
    text-align: center;
    margin-left: 50%;
    transform: translateX(-75px);
    display: none;
}
</style>
