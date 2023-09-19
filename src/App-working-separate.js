// Import dependencies
import React, { useRef, useState, useEffect } from "react";
import * as tf from "@tensorflow/tfjs";
// 1. TODO - Import required model here
import * as cocossd from "@tensorflow-models/coco-ssd";
import Webcam from "react-webcam";
import Clock from "./Clock";
import "./App.css";
// 2. TODO - Import drawing utility here
// e.g. 
// import { drawRect } from "./utilities";


function App() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const clockRef = useRef(null);
  let [pointY, setPointY] = useState(800);
  let [logCount, setLogCount] = useState(0);

  const log = (...msg) => {
    if(logCount < 100)  
      console.log(logCount++,...msg)
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

      if(label){

        // Set the rectangle stroke color and width
        ctx.strokeStyle = "#FF0000"; // Red color
        ctx.lineWidth = 2;
  
        // Draw the rectangle
        ctx.beginPath();
        ctx.rect(x, y, width, height);
        ctx.stroke();
  
        // Set the text label style
        const textSize = Math.max(width / 10, 10); // Adjust the font size as needed
        ctx.font = `${textSize}px Arial`;
        ctx.fillStyle = "#FF0000"; // Red color
  
        // Draw the text label above the rectangle
        ctx.fillText(label, x, y > 10 ? y - 5 : 10); // Ensure the text is not drawn outside the canvas
        ctx.font = `${textSize - 5}px serif`;
        ctx.fillStyle = "orange"; // Red color
        ctx.fillText(Math.floor(score*100)+"%", x+width-100, y > 10 ? y - 5 : 10); // Ensure the text is not drawn outside the canvas

      }

    });
  }
  // Main function
  const runCoco = async () => {
    // 3. TODO - Load network 
    // e.g. 
    const net = await cocossd.load({base: "mobilenet_v2"});
    
    //  Loop and detect hands
    setInterval(() => {
      detect(net);
    }, 3000);
    // Load the coco-ssd model
    // const net = await tf.loadGraphModel('path_to_your_model/model.json');
   
    // Loop and detect objects
    // setInterval(() => {
    //   detect(net);
    // }, 10);
  };

  const detect = async (net) => {
    // Check data is available
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

      let newY = 888888; // Initialize a variable to hold the new Y position

      // Find the Y position of the "person" prediction if available
      const personPrediction = obj.find((prediction) => prediction.class.length > 1);
      if (personPrediction) {
        newY = personPrediction.bbox[1];
      }

      // Update pointY outside of the find function
      setPointY(newY);
      pointY = newY;

      // log("point",newY,pointY);

      
    }
  };

  useEffect(() => {
    setLogCount(logCount+1);
    log("point", pointY);
  }, [pointY]);

  useEffect(()=>{runCoco()},[]);


  return (
    <div className="App">
      <header className="App-header">
        <Webcam
          ref={webcamRef}
          muted={true} 
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
        <Clock 
          maxY = {pointY}
          style={{
            position: "absolute",
            marginLeft: "auto",
            marginRight: "auto",
            marginBottom: "250px",
            left: 0,
            right: 0,
            textAlign: "center",
            zindex: 8,
            width: 400,
            height: 230,
          }} 
        /> 

      </header>
    </div>
  );
}

export default App;
