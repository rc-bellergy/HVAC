import Head from 'next/head';
import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the Three.js component to avoid SSR issues
const ThreeScene = dynamic(() => import('../components/ThreeScene'), { ssr: false });

export default function Home() {
  return (
    <div>
      <Head>
        <title>IoTer HVAC Digital Twin Demo</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>

      <div id="app">
        <div className="hud">
          <div className="brand">
            <img src="/assets/IoTer-Logo-white.svg" alt="IoTer Logo" style={{ verticalAlign: 'middle', marginRight: '2em', marginLeft: '1em' }} />
            HVAC Digital Twin Demo
          </div>
          <div className="legend">
            <span className="chip"><span className="sw ok"></span>Normal</span>
            <span className="chip"><span className="sw warn"></span>Warning</span>
            <span className="chip"><span className="sw alert"></span>Alarm</span>
          </div>
          <div className="sp"></div>
          <div className="seg" role="group" aria-label="Flow">
            <input type="radio" id="flowOff" name="flow" value="0" />
            <label htmlFor="flowOff">Flow Off</label>
            <input type="radio" id="flowOn" name="flow" value="1" defaultChecked />
            <label htmlFor="flowOn">Flow On</label>
            <input type="radio" id="flowFast" name="flow" value="2" />
            <label htmlFor="flowFast">Turbo</label>
          </div>
          <button className="btn" id="btnReset">Reset Camera</button>
          <button className="btn" id="btnAutoRotate">Auto Rotate: ON</button>
          <button className="btn" id="btnTheme">Theme</button>
        </div>

        <div id="three-container">
          <ThreeScene />
        </div>

        <div className="footer">IoTer Digital Twin Demo • HVAC System Monitoring</div>
      </div>

      <aside className="side left" id="side-left">
        <div className="panel">
          <h3>Selected Asset</h3>
          <div className="kv">
            <div>ID</div><div id="selId">–</div>
            <div>Name</div><div id="selName">Tap an object</div>
            <div>Status</div><div id="selStatus">–</div>
            <div>Temp</div><div id="selTemp">–</div>
            <div>Load</div><div id="selLoad">–</div>
          </div>
        </div>
        <div className="panel">
          <h3>Process Throughput</h3>
          <div className="big"><span id="throughput">0.00</span> t/h</div>
          <canvas id="spark"></canvas>
        </div>

        <div className="panel">
          <h3>Operating Status of Air Compressor Unit</h3>
          <div className="compressor-grid">
            <div className="compressor-unit active">
              <div className="status-indicator"></div>
              <div className="compressor-icon"></div>
              <div className="compressor-label">1#Air</div>
            </div>
            <div className="compressor-unit active">
              <div className="status-indicator"></div>
              <div className="compressor-icon"></div>
              <div className="compressor-label">2#Air</div>
            </div>
            <div className="compressor-unit active">
              <div className="status-indicator"></div>
              <div className="compressor-icon"></div>
              <div className="compressor-label">3#Air</div>
            </div>
            <div className="compressor-unit active">
              <div className="status-indicator"></div>
              <div className="compressor-icon"></div>
              <div className="compressor-label">4#Air</div>
            </div>
            <div className="compressor-unit active">
              <div className="status-indicator"></div>
              <div className="compressor-icon"></div>
              <div className="compressor-label">5#Air</div>
            </div>
            <div className="compressor-unit active">
              <div className="status-indicator" style={{ background: '#4ade80' }}></div>
              <div className="compressor-icon"></div>
              <div className="compressor-label">6#Air</div>
            </div>
          </div>
        </div>
      </aside>

      <aside className="side right" id="side">
        <div className="panel">
          <h3>Air Pressure System</h3>
          <div className="kv">
            <div>Total power consumption</div>
            <div>
              <span className="metric-value" id="power-today">1002.15</span>
              <span className="metric-unit">kWh</span>
            </div>
          </div>
          <div className="kv">
            <div>Year</div>
            <div>
              <span className="metric-value" id="power-year">7,234,567,890</span>
              <span className="metric-unit">kWh</span>
            </div>
          </div>
          <h3>Total Compressed Air Supply</h3>
          <div className="kv">
            <div>Today</div>
            <div>
              <span className="metric-value" id="air-today">1002.15</span>
              <span className="metric-unit">m³</span>
            </div>
          </div>
          <div className="kv">
            <div>Year</div>
            <div>
              <span className="metric-value" id="air-year">7,234,567,890</span>
              <span className="metric-unit">m³</span>
            </div>
          </div>
          <h3>Energy Efficiency Ratio</h3>
          <div className="chart-container">
            <canvas id="efficiency-chart"></canvas>
          </div>
        </div>

        <div className="panel">
          <h3>Power Consumption Comparison</h3>
          <div className="bar-chart">
            <div className="bar-item">
              <div className="bar-label">1#workshop</div>
              <div className="bar-container">
                <div className="bar-fill" style={{ width: '85%' }}></div>
              </div>
            </div>
            <div className="bar-item">
              <div className="bar-label">2#workshop</div>
              <div className="bar-container">
                <div className="bar-fill" style={{ width: '75%' }}></div>
              </div>
            </div>
            <div className="bar-item">
              <div className="bar-label">3#workshop</div>
              <div className="bar-container">
                <div className="bar-fill" style={{ width: '90%' }}></div>
              </div>
            </div>
            <div className="bar-item">
              <div className="bar-label">4#workshop</div>
              <div className="bar-container">
                <div className="bar-fill" style={{ width: '65%' }}></div>
              </div>
            </div>
            <div className="bar-item">
              <div className="bar-label">5#workshop</div>
              <div className="bar-container">
                <div className="bar-fill" style={{ width: '80%' }}></div>
              </div>
            </div>
            <div className="bar-item">
              <div className="bar-label">6#workshop</div>
              <div className="bar-container">
                <div className="bar-fill" style={{ width: '70%' }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="panel">
          <h3>Yield Comparison</h3>
          <div className="bar-chart">
            <div className="bar-item">
              <div className="bar-label">1#work</div>
              <div className="bar-container">
                <div className="bar-fill" style={{ width: '75%' }}></div>
              </div>
            </div>
            <div className="bar-item">
              <div className="bar-label">2#work</div>
              <div className="bar-container">
                <div className="bar-fill" style={{ width: '85%' }}></div>
              </div>
            </div>
            <div className="bar-item">
              <div className="bar-label">3#work</div>
              <div className="bar-container">
                <div className="bar-fill" style={{ width: '70%' }}></div>
              </div>
            </div>
            <div className="bar-item">
              <div className="bar-label">4#work</div>
              <div className="bar-container">
                <div className="bar-fill" style={{ width: '88%' }}></div>
              </div>
            </div>
            <div className="bar-item">
              <div className="bar-label">5#work</div>
              <div className="bar-container">
                <div className="bar-fill" style={{ width: '60%' }}></div>
              </div>
            </div>
            <div className="bar-item">
              <div className="bar-label">6#work</div>
              <div className="bar-container">
                <div className="bar-fill" style={{ width: '78%' }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="panel">
          <h3>Actions</h3>
          <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
            <button className="btn" id="btnStart">Start Line</button>
            <button className="btn" id="btnStop">Stop Line</button>
            <button className="btn" id="btnPulse">Pulse Alarm</button>
          </div>
        </div>
      </aside>
    </div>
  );
}