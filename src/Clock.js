import React, { useEffect, useRef, useState } from 'react';
import "./App.css";

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
      size = Math.random() * 7; // random size of particle

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
    this.hidden = false;

  }
}

const ParticleClock = (props) => {
  const canvasRef = useRef(null);
  // const [ctx, setCtx] = useState();
  let [bgGrad, setBgGrad] = useState(false);
  let [gradient, setGradient] = useState();
  let [height, setHeight] = useState(400);
  let [key, setKey] = useState({up: false, shift: false});
  let [particles, setParticles] = useState([]);
  let [particleColor, setParticleColor] = useState('hsla(0, 0%, 100%, 0.3)');
  let [mouse, setMouse] = useState({x: 0, y: 0});
  let [press, setPress] = useState(false);
  let [quiver, setQuiver] = useState(false);
  // const [text, setText] = useState("");
  let [textSize, setTextSize] = useState(140);
  let [valentine, setValentine] = useState(false);
  let [msgTime, setMsgTime] = useState(100);
  let [updateColor, setUpdateColor] = useState(true);
  let [width, setWidth] = useState(800);
  let [logCount, setLogCount] = useState(0);


  var ctx;
  var text = "";
  const canvasWidth = props.width??640; // Adjust as needed
  const canvasHeight = props.height??480; // Adjust as needed
  const FRAME_RATE = 20; // frames per second target
  const MIN_WIDTH = 800; // minimum width of canvas
  const MIN_HEIGHT = 600; // minimum height of canvas
//   let MAX_Y = props.maxY ?? 590; // minimum height of canvas
  let MAX_Y = 210; // minimum height of canvas
  const PARTICLE_NUM = 600; // (max) number of particles to generate
  const RADIUS = Math.PI * 2; // radius of particle

  const log = (...msg) => {
    if(logCount < 100)  
      console.log(logCount++,...msg)
  }

  const defaultStyles = () => {
    textSize = (140);
    // particle color
    particleColor = ('hsla(0, 0%, 100%, 0.3)'); 
    // color stops
    var gradientStops = { 0: '#333333', 0.5: '#222222'};
    // create gradient
    gradient = gradientStops;
  };

  const draw = (p) => {
    ctx.fillStyle = particleColor;
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
    textSize = (140);
    // draw text on canvas
    if(valentine === true) 
    {
        if(msgTime > 0) {
          textSize = (180);
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
    log("particle",MAX_Y);

    MAX_Y += 3;

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
            if(!p.hidden && p.y < MAX_Y){
                draw(p);
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
          var canvas = canvasRef.current;
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
      canvasRef.current.width = width;
      canvasRef.current.height = height;
    //   canvasRef.current.style.position = 'absolute';
    //   canvasRef.current.style.left = '0px';
    //   canvasRef.current.style.top = '0px';
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
      particleColor = ('hsla(' + hue + ', 10%, 50%, 0.3)');
      // create gradient
      setGradientFxn(gradientStops);
  };

  const init = () => {
    var canvas = canvasRef.current;
    // console.log(canvas);
    // console.log(canvas.width);
    // make sure canvas exists and that the browser understands it
    if(canvas === null || !canvas.getContext) {
        return;
    }
    // set context
    ctx = canvas.getContext("2d");
    // set dimensions
    setDimensions();
    // ui
    ui();

    for(var i = 0; i < PARTICLE_NUM; i++) {
        particles[i] = new Particle(canvas);
    }   
    // console.log(pt,particles);
    // show FPS
    // FPS.initialize(canvas, 'fps');
    // set defaults
    defaultStyles();
    // let's do this
    // loop();
    // setInterval(loop, 400);
    // setInterval(loop, FRAME_RATE);

};

const ui = () =>{
    var canvas = canvasRef.current;
    // UI: buttons and events
    // var toggleOptions = document.getElementById('toggle-options'),
    //     options = document.getElementById('options'),
    //     onMsg = '[-] Hide Options',
    //     offMsg = '[+] Show Options',
    //     quiverBtn = document.getElementById('quivers'),
    //     gradientBtn = document.getElementById('gradient'),
    //     valentineifyBtn = document.getElementById('valentineify'),
    //     colorBtn = document.getElementById('color');
    // toggleOptions.innerHTML = offMsg;
    // /**
    //  * Events
    //  */
    // toggleOptions.addEventListener('click', function(e) {
    //     e.preventDefault();
    //     if(options.className === 'on') {
    //         options.className = '';
    //         toggleOptions.innerHTML = offMsg;
    //     } else {
    //         options.className = 'on';
    //         toggleOptions.innerHTML = onMsg;
    //     }
    // }, false);

    // quiverBtn.addEventListener('click', function(e) {
    //     e.preventDefault();
    //     if(quiverBtn.className === 'on') {
    //         quiverBtn.className = '';
    //         quiver = false;
    //     } else {
    //         quiverBtn.className = 'on';
    //         quiver = true;
    //     }
    // }, false);

    // gradientBtn.addEventListener('click', function(e) {
    //     e.preventDefault();
    //     if(gradientBtn.className === 'on') {
    //         gradientBtn.className = '';
    //         bgGrad = false;
    //     } else {
    //         gradientBtn.className = 'on';
    //         bgGrad = true;
    //     }
    // }, false);

    // valentineifyBtn.addEventListener('click', function(e) {
    //     e.preventDefault();
    //     if(valentineifyBtn.className === 'on') {
    //         valentineifyBtn.className = '';
    //         valentine = false;
    //         msgTime = 0;
    //     } else {
    //         valentineifyBtn.className = 'on';
    //         msgTime = 60;
    //         valentine = true;
    //     }
    // }, false);

    // colorBtn.addEventListener('click', function(e) {
    //     e.preventDefault();
    //     if(colorBtn.className === 'on') {
    //         colorBtn.className = '';
    //         updateColor = false;
    //     } else {
    //         colorBtn.className = 'on';
    //         updateColor = true;
    //     }
    // }, false);

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

  useEffect(() => {
    init();
    // loop();
    const intervalId = setInterval(loop, 400);
    return () => {
      clearInterval(intervalId); // Clear the interval
      // Remove event listeners if any
    };
  },[]);

//   useEffect(() => {
//     setLogCount(logCount+1);
//     log("max", MAX_Y);
//   }, [MAX_Y]);

  return (
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        id="canvas"
        style={props.style??{}}
      >
        <p className="nope">No canvas, no particles</p>
      </canvas>
  );
};

export default ParticleClock;
