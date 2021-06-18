import 'react-app-polyfill/ie11';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {HighstreetIsland} from "../.";
const App = () => {
  return (
    <div>
      <HighstreetIsland style={{
        width: 500,
        height: 400
      }} />
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
