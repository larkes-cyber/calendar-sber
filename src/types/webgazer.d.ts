declare module 'webgazer' {
  type GazeData = { x: number; y: number } | null;
  type WebGazer = {
    begin: () => Promise<WebGazer> | WebGazer;
    end: () => WebGazer;
    clearGazeListener: () => WebGazer;
    saveDataAcrossSessions: (value: boolean) => WebGazer;
    showVideoPreview: (value: boolean) => WebGazer;
    showPredictionPoints: (value: boolean) => WebGazer;
    applyKalmanFilter: (value: boolean) => WebGazer;
    setRegression: (name: 'ridge' | 'weightedRidge' | 'threadedRidge') => WebGazer;
    setGazeListener: (listener: (data: GazeData, elapsedTime: number) => void) => WebGazer;
    recordScreenPosition: (x: number, y: number, eventType?: 'click' | 'move') => WebGazer;
  };
  const webgazer: WebGazer;
  export default webgazer;
}
