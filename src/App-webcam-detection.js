// Import dependencies
import React, { useRef, useState, useEffect } from "react";
import * as tf from "@tensorflow/tfjs";
// 1. TODO - Import required model here
import * as cocossd from "@tensorflow-models/coco-ssd";
import Webcam from "react-webcam";
import "./App.css";
// 2. TODO - Import drawing utility here
// e.g. 
// import { drawRect } from "./utilities";

// Define the drawRect function
function drawRect(predictions, ctx) {
  // Loop through the array of predictions
  predictions.forEach((prediction) => {
    // Destructure the prediction object
    const { bbox, class: label,score } = prediction;
    const [x, y, width, height] = bbox;

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
  });
}


function App() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);

  // Main function
  const runCoco = async () => {
    // 3. TODO - Load network 
    // e.g. 
    const net = await cocossd.load({base: "mobilenet_v2"});
    
    //  Loop and detect hands
    // setInterval(() => {
    //   detect(net);
    // }, 10);

    // Load the coco-ssd model
    // const net = await tf.loadGraphModel('path_to_your_model/model.json');

    // Loop and detect objects
    setInterval(() => {
      detect(net);
    }, 10);
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
      // console.log("obj",obj);
      // console.log("ctx",ctx);
      drawRect(obj, ctx)  
    }
  };

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
      </header>
    </div>
  );
}

export default App;
