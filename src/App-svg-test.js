// Import dependencies
import React, { useRef, useState, useEffect } from "react";

import "./App.css";
import Logo from './flex-svg.svg';

function App() {
  const [svgContent, setSvgContent] = useState('');
  
  const log = (...msg) => {
    if(logCount < 100)  
      console.log(logCount++,...msg)
  }

  useEffect(() => {

    fetch('./flex-svg.svg')
      .then((response) => response.text())
      .then((data) => {
        // Set the SVG content in the state
        // setSvgContent(data);
        const parser = new DOMParser();
        const svgDocument = parser.parseFromString(data, 'image/svg+xml');

        // Find and execute scripts within the SVG
        const scripts = svgDocument.querySelectorAll('script');
        scripts.forEach((script) => {
          // Create a new script element
          const newScript = document.createElement('script');
          newScript.text = script.textContent;

          // Append the new script element to the document
          document.body.appendChild(newScript);

          // Clean up by removing the original script element
          script.parentNode.removeChild(script);
        });

        // Append the sanitized SVG to the DOM
        const svgContainer = document.getElementById('svg-container');
        svgContainer.appendChild(svgDocument.documentElement);
      })
      .catch((error) => {
        console.error('Error loading SVG:', error);
      });
  },[]);


  return (
    <div className="App">
      {/* <img src={Logo} alt="Logo" /> */}
      <div dangerouslySetInnerHTML={{ __html: svgContent }} />
    </div>
  );
}

export default App;
