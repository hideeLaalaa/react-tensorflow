// Import dependencies
import React, { useRef, useState, useEffect } from "react";
import * as tf from "@tensorflow/tfjs";
// 1. TODO - Import required model here
import * as cocossd from "@tensorflow-models/coco-ssd";
import Webcam from "react-webcam";
// import Clock from "./Clock";
import "./App.css";
// 2. TODO - Import drawing utility here
// e.g. 
// import { drawRect } from "./utilities";
var FPS = {  
  // defaults
  delta: 0,
  lastTime: 0,
  frames: 0,
  totalTime: 0,
  updateTime: 0,
  updateFrames: 0,
  initialize: function(canvasID, fpsID) {
      this.lastTime = (new Date()).getTime();
      if(!document.getElementById(fpsID) && document.getElementById(canvasID)) {
          this.createFPS(canvasID, fpsID);
      }
  },
  // create FPS div if needed
  createFPS: function(canvasID, fpsID) {
      var div = document.createElement('div');
      div.setAttribute('id', fpsID);
      var canvas = document.getElementById(canvasID);
      var parent = canvas.parentNode;
      div.innerHTML = "FPS AVG: 0 CURRENT: 0";
      parent.appendChild(div);
  },
  // update FPS count
  update: function(fpsID) {    
      var now = (new Date()).getTime();
      this.delta = now - this.lastTime;
      this.lastTime = now;
      this.updateTime += this.delta;
      this.totalTime += this.delta;
      this.frames++;
      this.updateFrames++;
      document.getElementById(fpsID).innerHTML = "FPS Average: " + Math.round(1000 * this.frames / this.  totalTime) + " Current: " + Math.round(1000 * this.updateFrames / this.updateTime);
      this.updateTime = 0; // reset time
      this.updateFrames = 0; // reset frames
  }
};

class Particle {
  constructor(canvas) {
    var range = Math.random() * 180 / Math.PI, // random starting point
      spread = canvas.height, // how far away from text should the particles begin?
      size = Math.random() * 8; // random size of particle

    this.delta = 1;
    // this.delta = 0.4;
    this.x = 0;
    this.y = 10;

    // starting positions
    this.px = (canvas.width / 2) + (Math.cos(range) * spread);
    this.py = (canvas.height / 2) + (Math.sin(range) * spread);

    this.velocityX = Math.floor(Math.random() * 10) - 5;
    this.velocityY = Math.floor(Math.random() * 10) - 5;

    this.size = size;
    this.origSize = size;

    this.inText = false;

  }
}

function App() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  let [pointY, setPointY] = useState(800);
  let [logCount, setLogCount] = useState(0);

  const clockRef = useRef(null);
  let [bgGrad, setBgGrad] = useState(false);
  let [gradient, setGradient] = useState();
  let [height, setHeight] = useState(400);
  let [key, setKey] = useState({up: false, shift: false});
  let [particles, setParticles] = useState([]);
  let [particleColor, setParticleColor] = useState('hsla(0, 0%, 100%, 0.7)');
  let [noParticleColor, setNoParticleColor] = useState('hsla(0, 0%, 100%, 0.01)');
  let [mouse, setMouse] = useState({x: 0, y: 0});
  let [press, setPress] = useState(false);
  let [quiver, setQuiver] = useState(false);
  // const [text, setText] = useState("");
  let [textSize, setTextSize] = useState(140);
  let [valentine, setValentine] = useState(false);
  let [msgTime, setMsgTime] = useState(100);
  let [updateColor, setUpdateColor] = useState(true);
  let [width, setWidth] = useState(800);

  var ctx;
  var text = "";
  const canvasWidth = 640; // Adjust as needed
  const canvasHeight = 480; // Adjust as needed
  const FRAME_RATE = 20; // frames per second target
  const MIN_WIDTH = 800; // minimum width of canvas
  const MIN_HEIGHT = 600; // minimum height of canvas
  let MAX_Y =  590; // minimum height of canvas
  // let MAX_Y = 210; // minimum height of canvas
  const PARTICLE_NUM = 1200; // (max) number of particles to generate
  const RADIUS = Math.PI * 2; // radius of particle

  const log = (...msg) => {
    if(logCount < 100)  
      console.log(logCount++,...msg)
  }

  const defaultStyles = () => {
    textSize = (240);
    // particle color
    particleColor = ('hsla(0, 0%, 100%, 0.7)'); 
    noParticleColor = ('hsla(0, 0%, 100%, 0.01)'); 
    // color stops
    var gradientStops = { 0: '#333333', 0.5: '#222222'};
    // create gradient
    gradient = gradientStops;
  };

  const draw = (p,underlay) => {
    ctx.fillStyle = underlay?noParticleColor:particleColor;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, RADIUS, true);
    ctx.closePath();
    ctx.fill();
  };

  const explode = () => {
    for(var i = 0, l = particles.length; i < l; i++) {
        var p = particles[i];

        if(p.inText) {
          var ax = mouse.x - p.px,
          ay = mouse.y - p.py,
          angle = Math.atan2(ay, ax),
          polarity,
          C = Math.cos(angle),
          S = Math.sin(angle);
          // change polarity
          // attract particles if mouse pressed, repel if shift + mousedown
          polarity = (key.shift === true) ? -1 : 1;
          p.x += polarity * (Math.pow((C-1), 2) -1) + p.velocityX * p.delta;
          p.y += polarity * (Math.pow((S-1), 2) -1) + p.velocityY * p.delta;
          // set previous positions
          p.px = p.x;
          p.py = p.y;
          draw(p);
        }
    }
  };

  const getTime = (amPM) => {
    var date = new Date(), hours = date.getHours(), timeOfDay = '';
    if(amPM) {
        hours = ( hours > 12 ) ? hours -= 12 : hours;
        hours = ( hours == 0 ) ? 12 : hours;
    } else {
        hours = pad(hours);
    }
    var minutes = pad(date.getMinutes());
    var seconds = pad(date.getSeconds());
    return {
        hours: hours,
        minutes: minutes,
        seconds: seconds,
        timeString: hours + " : " + minutes
        // timeString: hours + " : " + minutes + " : " + seconds
    };
  };

  // animation loop
  const loop = () => {
    // clear out text
    // console.log(text)
    ctx.clearRect(0, 0, width, height);
    var time = getTime(true);
    textSize = (240);
    // draw text on canvas
    if(valentine === true) 
    {
        if(msgTime > 0) {
          textSize = (240);
            // setText('♥');
            text = '♥';
            msgTime--;
        } else {
            // setText(time.timeString);
            text = time.timeString;
        }
        // valentine-ify it by setting hue to pink
        setStyles(300);

    } 
    else if(updateColor === true || bgGrad === true) 
    {
        // changing color with time
        // @TODO: come up with something better, this is a hacky implementation
        var color = time.hours + time.minutes + time.seconds;
        setStyles(color);
        // setText(time.timeString);
        text = time.timeString;
        // console.log(time.timeString,text);
    } else {
        defaultStyles();
        // setText(time.timeString);
        text = time.timeString;
        // console.log(time.timeString,text);
    }

    ctx.fillStyle = "rgb(255, 255, 255)";
    ctx.textBaseline = "middle";
    ctx.font = textSize + "px 'Avenir', 'Helvetica Neue', 'Arial', 'sans-serif'";
    ctx.fillText(text, (width - ctx.measureText(text).width) * 0.5, height * 0.5);

    // copy pixels
    var imgData = ctx.getImageData(0, 0, width, height);
  
    // clear canvas, again
    ctx.clearRect(0, 0, width, height);

    if(bgGrad === true) {
        // draw gradient
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
    }

    if(press === false) {
        // reset particles
        for(var i = 0, l = particles.length; i < l; i++) {
            var p = particles[i];
            p.inText = false;
        }
        // console.log(5,imgData);
        particleText(imgData);
    } else {
        explode();
        // console.log(imgData)
    }
    // log("particle",MAX_Y);

    // FPS.update('fps');
  };

  const pad = (number) => {
    return ('0' + number).substr(-2);
  };

  const particleText = (imgData) => {
    var pxls = [];
    for(var w = width; w > 0; w-=6) {
        for(var h = 0; h < width ; h+=6) {
            var index = (w+h*(width))*4;
            if(imgData.data[index] > 10) {
                pxls.push([w, h]);
            }
        }
    }
    var count = pxls.length;
    // console.log(pxls.length,particles.length);
    for(var i = 0; i < pxls.length && i < particles.length; i++) {
        try {
            var p = particles[i], X, Y;

            if(quiver) {
                X = (pxls[count-1][0]) - (p.px + Math.random() * 5);
                Y = (pxls[count-1][1]) - (p.py + Math.random() * 5);
            } else {
                X = (pxls[count-1][0]) - p.px;
                Y = (pxls[count-1][1]) - p.py;
            }
            // tangent
            var T = Math.sqrt(X*X + Y*Y);
            // arctangent
            var A = Math.atan2(Y, X);
            // cosine
            var C = Math.cos(A);
            // sine
            var S = Math.sin(A);
            // set new postition
            p.x = p.px + C * T * p.delta;
            p.y = p.py + S * T * p.delta;
            // set previous positions
            p.px = p.x;
            p.py = p.y;
            p.inText = true;
            // if(i == pxls.length - 1){
            //     console.log(X,Y,p.x,p.y)
            // }
            // if(i == pxls.length - 1){
            //     console.log(X,Y,p.x,p.y)
            // }
            // draw the particle
            if(p.y < MAX_Y){
              draw(p);
            }else{
              draw(p,true);
            }
            if(key.up === true) {
                p.size += 0.3;
            } else {
                var newSize = p.size - 0.5;
                if(newSize > p.origSize && newSize > 0) {
                    p.size = newSize;
                } else {
                    p.size = p.origSize;
                }
            }
        } catch(e) {
            console.log(e);
        }
        count--;
    }
  };

  const setCoordinates = (e) => {
      if(e.offsetX) {
          return { x: e.offsetX, y: e.offsetY }; // use offset if available
      } else if (e.layerX) {
          return { x: e.layerX, y: e.layerY }; // firefox... make sure to position the canvas
      } else {
          // iOS. Maybe others too?
          var canvas = clockRef.current;
          return { x: e.pageX - canvas.offsetLeft, y: e.pageY - canvas.offsetTop };
      }
  };

  const setDimensions = () => {
      // setWidth(Math.max(window.innerWidth, MIN_WIDTH));
      // setHeight(Math.max(window.innerHeight, MIN_HEIGHT));
    //   width = Math.max(window.innerWidth, MIN_WIDTH);
    //   height = Math.max(window.innerHeight, MIN_HEIGHT);
      // setHeight(480);
      // Resize the canvas
      // console.log(window.innerWidth, MIN_WIDTH,Math.max(window.innerWidth, MIN_WIDTH));
      // console.log(width);
      clockRef.current.width = width;
      clockRef.current.height = height;
    //   clockRef.current.style.position = 'absolute';
    //   clockRef.current.style.left = '0px';
    //   clockRef.current.style.top = '0px';
  };

  const setGradientFxn = (gradientStops) => { 
    // create gradient
    let grad = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width);
    // iterate through colorstops
    for (var position in gradientStops) {
        var color = gradientStops[position];
        grad.addColorStop(position, color);
    }
    gradient = (grad);
  };

  const setStyles = (hue) => {
      // color stops
      var gradientStops = { 
          0: 'hsl(' + hue + ', 100%, 100%)',
          0.5: 'hsl(' + hue +', 10%, 50%)'
      };
      // change particle color
      particleColor = ('hsla(' + hue + ', 10%, 50%, 0.7)');
      noParticleColor = ('hsla(' + hue + ', 10%, 50%, 0.01)');
      // create gradient
      setGradientFxn(gradientStops);
  };

  const init = () => {
    var canvas = clockRef.current;
    // console.log(canvas);
    // console.log(canvas.width);
    // make sure canvas exists and that the browser understands it
    if(canvas === null || !canvas.getContext) { return;}
    // set context
    ctx = canvas.getContext("2d");
    // set dimensions
    setDimensions();
    // ui
    ui();

    for(var i = 0; i < PARTICLE_NUM; i++) {
        particles[i] = new Particle(canvas);
    }   
    defaultStyles();
  };

  const ui = () =>{
    var canvas = clockRef.current;
    document.addEventListener('keydown', function(e) {
        switch(e.keyCode ) {
            case 16: // shift
                key.shift = true;
                e.preventDefault();
                break;
            case 38: // up key
                key.up = true;
                e.preventDefault();
                break;
        }
    }, false);

    document.addEventListener('keyup', function(e) {
        switch(e.keyCode ) {
            case 16: // shift
                key.shift = false;
                e.preventDefault();
                break;
            case 38: // space
                key.up = false;
                e.preventDefault();
                break;
        }
    }, false);

    window.addEventListener('resize', function(e){
        setDimensions();
    }, false);

    canvas.addEventListener('mousedown', function(e){
        press = true;
    }, false);

    document.addEventListener('mouseup', function(e){
        press = false;
    }, false);

    canvas.addEventListener('mousemove', function(e) {
        if(press) {
            mouse = setCoordinates(e);
        }
    }, false);
    // @TODO: add touch events
  }

  // Define the drawRect function
  function drawRect(predictions, ctx) {
    // Loop through the array of predictions
    // setPointY(0);
    predictions.forEach((prediction) => {
      // Destructure the prediction object
      const { bbox, class: label,score } = prediction;
      const [x, y, width, height] = bbox;

      // if(label == "person"){
      //   setPointY(y);
      // }
      // log("point",pointY);
      // if(label && score > 0.66){

      //   // Set the rectangle stroke color and width
      //   ctx.strokeStyle = "#FF0000"; // Red color
      //   ctx.lineWidth = 2;
  
      //   // Draw the rectangle
      //   ctx.beginPath();
      //   ctx.rect(x, y, width, height);
      //   ctx.stroke();
  
      //   // Set the text label style
      //   const textSize = Math.max(width / 10, 10); // Adjust the font size as needed
      //   ctx.font = `${textSize}px Arial`;
      //   ctx.fillStyle = "#FF0000"; // Red color
  
      //   // Draw the text label above the rectangle
      //   ctx.fillText(label, x, y > 10 ? y - 5 : 10); // Ensure the text is not drawn outside the canvas
      //   ctx.font = `${textSize - 5}px serif`;
      //   ctx.fillStyle = "orange"; // Red color
      //   ctx.fillText(Math.floor(score*100)+"%", x+width-100, y > 10 ? y - 5 : 10); // Ensure the text is not drawn outside the canvas

      // }

    });
  }
  // Main function
  const runCoco = async () => {
    // 3. TODO - Load network 
    // e.g. 
    const net = await cocossd.load({base: "lite_mobilenet_v2"});
    
    //  Loop and detect hands
    const intervalId = setInterval(() => {
      detect(net);
      // loop();
    }, 1000);

    return () => {
      clearInterval(intervalId); // Clear the interval
      // Remove event listeners if any
    };

    // Load the coco-ssd model
    // const net = await tf.loadGraphModel('path_to_your_model/model.json');
   
    // Loop and detect objects
    // setInterval(() => {
    //   detect(net);
    // }, 10);
  };

  const detect = async (net) => {
    // Check data is available
    MAX_Y = 800;
    if (
      typeof webcamRef.current !== "undefined" &&
      webcamRef.current !== null &&
      webcamRef.current.video.readyState === 4
    ) {
      // Get Video Properties
      const video = webcamRef.current.video;
      const videoWidth = webcamRef.current.video.videoWidth;
      const videoHeight = webcamRef.current.video.videoHeight;

      // Set video width
      webcamRef.current.video.width = videoWidth;
      webcamRef.current.video.height = videoHeight;

      // Set canvas height and width
      canvasRef.current.width = videoWidth;
      canvasRef.current.height = videoHeight;

      // 4. TODO - Make Detections
      const obj = await net.detect(video);

      // Draw mesh
      const ctx = canvasRef.current.getContext("2d");

      // 5. TODO - Update drawing utility
      // log("obj",obj);
    //   const obj = [
    //     {
    //         "bbox": [
    //             131.68527603149414,
    //             120.8968152999878,
    //             417.03596115112305,
    //             313.3800172805786
    //         ],
    //         "class": "person",
    //         "score": 0.5553544759750366
    //     }
    // ];
      // console.log("ctx",ctx);
      drawRect(obj, ctx)  

      let newY = 900; // Initialize a variable to hold the new Y position

      // Find the Y position of the "person" prediction if available
      const personPrediction = obj.find((prediction) => prediction.class.length > 1);
      if (personPrediction && (personPrediction.score || 0.5) > 0.66) {
        newY = personPrediction.bbox[1];
        MAX_Y = newY + 80;
      }

      // Update pointY outside of the find function
      // setPointY(newY);

      // log("point",newY,pointY);

      
    }
    loop();
    
  };

  // useEffect(()=>{runCoco()},[]);
  useEffect(() => {
    init();
    runCoco();
    // loop();
    // const intervalId = setInterval(loop, 400);
    // return () => {
    //   x();
    // };
  },[]);


  return (
    <div className="App">
      <header className="App-header">
        <Webcam
          ref={webcamRef}
          style={{
            position: "absolute",
            marginLeft: "auto",
            marginRight: "auto",
            left: 0,
            right: 0,
            textAlign: "center",
            zindex: 9,
            width: 640,
            height: 480,
          }}
        />

        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            marginLeft: "auto",
            marginRight: "auto",
            left: 0,
            right: 0,
            textAlign: "center",
            zindex: 8,
            width: 640,
            height: 480,
          }}
        />
        <canvas 
          ref={clockRef}
          width={canvasWidth}
          height={canvasHeight}
          id="canvas"
          style={{
            position: "absolute",
            marginLeft: "auto",
            marginRight: "auto",
            marginBottom: "250px",
            left: 0,
            right: 0,
            textAlign: "center",
            zindex: 8,
            width: 300,
            height: 230,
          }} 
        > 
         <p className="nope">No canvas, no particles</p>
        </canvas>
      </header>
    </div>
  );
}

export default App;
