import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { HighstreetIsland } from '../src';

describe('it', () => {
  it('renders without crashing', () => {
    const div = document.createElement('div');
    ReactDOM.render(
      <HighstreetIsland style={{}} worldConfig={{ gltfPath: '' }} />,
      div
    );
    ReactDOM.unmountComponentAtNode(div);
  });
});
