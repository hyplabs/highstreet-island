import 'react-app-polyfill/ie11';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { HighstreetIsland } from "../.";
import Stats from "stats.js"

// Display stats
const stats = new Stats();
document.body.appendChild( stats.dom );
function animate() {
    stats.update();
    requestAnimationFrame( animate );
}
requestAnimationFrame( animate );

const App = () => {
  return (
    <div className='container'>
      <HighstreetIsland style={{
        // width: 1000,
        // height: 800
        width: "100vw",
        height: "min(80vw, 100vh)"
      }} worldConfig={{
        gltfPath: "island.glb"
      }}/>
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
