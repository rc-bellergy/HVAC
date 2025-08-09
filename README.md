# IoTer HVAC Digital Twin Demo

A real-time 3D visualization platform for HVAC (Heating, Ventilation, and Air Conditioning) systems using digital twin technology. This demo showcases an interactive 3D model of an industrial HVAC system with live telemetry simulation, asset monitoring, and system controls.

## Deployed to:
https://hvac-digital-twin.ioter.ai/

## Vercel project:
https://vercel.com/mp-ioters-projects/hvac-digital-twin

## Technology Stack

- **Frontend Framework**: [Next.js](https://nextjs.org/) v14.2.5
- **UI Library**: [React](https://reactjs.org/) v18.3.1
- **3D Visualization**: [Three.js](https://threejs.org/) v0.164.1
- **Styling**: CSS3 with modern features (variables, flexbox, grid)
- **Deployment**: Vercel

## Key Features

### 3D Visualization
- Interactive 3D model of an HVAC system with tanks, chillers, and compressors
- Animated pipe flow visualization with customizable speed settings
- Dynamic lighting and post-processing effects (bloom)
- Responsive camera controls with auto-rotation and reset functionality
- Dark/light theme toggle

### Asset Monitoring
- Real-time telemetry simulation for all assets
- Color-coded status indicators (Normal, Warning, Alarm)
- Detailed asset information panel with temperature, load, and status
- Interactive asset selection by clicking on 3D components

### System Controls
- Flow control (Off, On, Turbo modes)
- Camera controls (Reset, Auto Rotate)
- Theme switching (Dark/Light mode)
- Simulated system actions (Start Line, Stop Line, Pulse Alarm)

### Data Visualization
- Real-time process throughput display with sparkline chart
- Power consumption metrics (daily and yearly)
- Compressed air supply metrics
- Energy efficiency ratio visualization
- Power consumption comparison across workshops
- Yield comparison across workshops

### Responsive Design
- Mobile-friendly interface with adaptive layouts
- Optimized performance for various screen sizes
- Touch-friendly controls

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn package manager

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   ```

2. Navigate to the project directory:
   ```bash
   cd hvac-digital-twin
   ```

3. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

### Development

To run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application in your browser.

### Building for Production

To create a production build:

```bash
npm run build
# or
yarn build
```

To start the production server:

```bash
npm start
# or
yarn start
```

## Project Structure

```
.
├── components/
│   └── ThreeScene.js      # 3D visualization component
├── pages/
│   ├── _app.js            # Next.js app component
│   └── index.js           # Main page
├── public/
│   └── assets/            # Static assets
├── styles/
│   └── globals.css        # Global styles
├── objects/               # 3D models
└── ...
```

## Usage

1. **Navigation**: 
   - Use mouse/touch to orbit around the 3D scene
   - Scroll to zoom in/out
   - Right-click and drag to pan

2. **Asset Interaction**:
   - Click on any asset (tank, chiller, compressor) to view its details
   - Asset status is color-coded (green=normal, orange=warning, red=alarm)

3. **System Controls**:
   - Adjust flow rate using the radio buttons (Off/On/Turbo)
   - Toggle auto-rotation of the camera
   - Reset camera to default position
   - Switch between dark and light themes

4. **Simulation**:
   - Use "Pulse Alarm" to simulate an alert condition on a random asset
   - View real-time metrics in the side panels

## Deployment

The application is deployed on Vercel and accessible at: https://hvac-digital-twin.ioter.ai/

For custom deployment:
1. Build the application using `npm run build`
2. Deploy the generated `.next` folder and `public` directory to your preferred hosting platform
3. Ensure environment variables are properly configured if needed

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is proprietary and confidential. All rights reserved by IoTer.