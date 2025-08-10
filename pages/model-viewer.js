import Head from 'next/head';
import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the Three.js component to avoid SSR issues
const ThreeScene = dynamic(() => import('../components/ThreeScene'), { ssr: false });

export default function ModelViewer() {
  return (
    <div>
      <Head>
        <title>HVAC Model Viewer</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>

      <div id="app">
        <div className="hud">
          <div className="brand">
            <img src="/assets/IoTer-Logo-white.svg" alt="IoTer Logo" style={{ verticalAlign: 'middle', marginRight: '2em', marginLeft: '1em' }} />
            HVAC Model Viewer
          </div>
          <div className="sp"></div>
          <button className="btn" id="btnReset">Reset Camera</button>
          <button className="btn" id="btnAutoRotate">Auto Rotate: ON</button>
          <button className="btn" id="btnTheme">Theme</button>
        </div>

        <div id="three-container">
          <ThreeScene modelPath="/objects/hvac-test-01.glb" />
        </div>

        <div className="footer">IoTer Digital Twin Demo • HVAC Model Viewer</div>
      </div>
    </div>
  );
}