import * as React from 'react';
import { createRef, CSSProperties, useEffect } from 'react';
import { CreateWorld, WorldConfig } from './createWorld';

export const HighstreetIsland: React.FC<{
  style: CSSProperties;
  worldConfig: WorldConfig;
}> = ({ style, worldConfig }) => {
  const canvasRef = createRef<HTMLCanvasElement>();
  const containerRef = createRef<HTMLDivElement>();
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;
    CreateWorld(canvasRef.current, containerRef.current, worldConfig);
  }, [canvasRef, containerRef, worldConfig]);

  return (
    <div ref={containerRef} style={style}>
      <canvas ref={canvasRef} />
    </div>
  );
};
