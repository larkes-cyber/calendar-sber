import { FaceLandmarker, FilesetResolver, type NormalizedLandmark } from '@mediapipe/tasks-vision';
import webgazer from 'webgazer';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode
} from 'react';

import styles from './AttentionAdExperience.module.css';

type Props = { children: ReactNode };
type CameraState = 'idle' | 'requesting' | 'ready' | 'denied' | 'unsupported';
type Phase = 'gate' | 'calibration' | 'advertisement' | 'finished';
type AttentionMode = 'loading' | 'webgazer' | 'face' | 'pointer';

const adSlides = [
  { src: '/ads/creative-plastic.png', alt: 'Реклама клиники креативной пластики' },
  { src: '/ads/logger-lite.png', alt: 'Реклама напитка «Логгер Лайт»' },
  { src: '/ads/glory-hole-park.png', alt: 'Реклама парка «Глори-хоул»' },
  { src: '/ads/pisswasser.png', alt: 'Реклама напитка Pisswasser' },
  { src: '/ads/redwood-junior.png', alt: 'Реклама «Редвуд Джуниорс»' },
  { src: '/ads/pets-by-night.png', alt: 'Реклама доставки питомцев' }
];

const calibrationPoints = [
  { x: 14, y: 18 },
  { x: 50, y: 18 },
  { x: 86, y: 18 },
  { x: 14, y: 50 },
  { x: 50, y: 50 },
  { x: 86, y: 50 },
  { x: 14, y: 82 },
  { x: 50, y: 82 },
  { x: 86, y: 82 }
];

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value));

const averageLandmarks = (landmarks: NormalizedLandmark[], indexes: number[]) => {
  const points = indexes.map((index) => landmarks[index]).filter(Boolean);
  return {
    x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
    y: points.reduce((sum, point) => sum + point.y, 0) / points.length
  };
};

const drawEye = (
  canvas: HTMLCanvasElement | null,
  video: HTMLVideoElement,
  landmarks: NormalizedLandmark[],
  indexes: number[]
) => {
  if (!canvas || !video.videoWidth || !video.videoHeight) return;
  const points = indexes.map((index) => landmarks[index]).filter(Boolean);
  const minX = Math.min(...points.map((point) => point.x));
  const maxX = Math.max(...points.map((point) => point.x));
  const minY = Math.min(...points.map((point) => point.y));
  const maxY = Math.max(...points.map((point) => point.y));
  const centerX = ((minX + maxX) / 2) * video.videoWidth;
  const centerY = ((minY + maxY) / 2) * video.videoHeight;
  const sourceWidth = Math.max((maxX - minX) * video.videoWidth * 1.5, 52);
  const sourceHeight = Math.max((maxY - minY) * video.videoHeight * 2.35, 38);
  const context = canvas.getContext('2d');
  if (!context) return;

  context.save();
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.translate(canvas.width, 0);
  context.scale(-1, 1);
  context.drawImage(
    video,
    centerX - sourceWidth / 2,
    centerY - sourceHeight / 2,
    sourceWidth,
    sourceHeight,
    0,
    0,
    canvas.width,
    canvas.height
  );
  context.restore();
};

export function AttentionAdExperience({ children }: Props) {
  const [phase, setPhase] = useState<Phase>('gate');
  const [cameraState, setCameraState] = useState<CameraState>('idle');
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));
  const [isWatching, setIsWatching] = useState(true);
  const [progress, setProgress] = useState(0);
  const [gaze, setGaze] = useState({ x: 0, y: 0 });
  const [attentionMode, setAttentionMode] = useState<AttentionMode>('loading');
  const [calibrationStep, setCalibrationStep] = useState(0);
  const [calibrationClicks, setCalibrationClicks] = useState(0);
  const [prankMessage, setPrankMessage] = useState('');
  const [bannerExpanded, setBannerExpanded] = useState(false);
  const [initialAdStarted, setInitialAdStarted] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const leftEyeRef = useRef<HTMLCanvasElement>(null);
  const rightEyeRef = useRef<HTMLCanvasElement>(null);
  const modeRef = useRef<AttentionMode>('loading');
  const webgazerStartedRef = useRef(false);
  const smoothedGazeRef = useRef({ x: 0, y: 0 });
  const lastAttentiveAtRef = useRef(performance.now());

  const changeMode = useCallback((mode: AttentionMode) => {
    modeRef.current = mode;
    setAttentionMode(mode);
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (webgazerStartedRef.current) {
      webgazer.clearGazeListener();
      try {
        webgazer.end();
      } catch {
        /* WebGazer already removed its private nodes. */
      }
      webgazerStartedRef.current = false;
    }
  }, []);

  useEffect(() => {
    const update = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', update);
    return () => document.removeEventListener('fullscreenchange', update);
  }, []);

  useEffect(() => stopCamera, [stopCamera]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = phase === 'finished' ? previousOverflow : 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== 'finished') return;
    const bannerTimeout = window.setTimeout(() => setBannerExpanded(true), 120);
    if (initialAdStarted) return () => window.clearTimeout(bannerTimeout);

    const adTimeout = window.setTimeout(() => {
      setInitialAdStarted(true);
      setProgress(0);
      setPhase('advertisement');
    }, 1800);
    return () => {
      window.clearTimeout(bannerTimeout);
      window.clearTimeout(adTimeout);
    };
  }, [initialAdStarted, phase]);

  const requestFullscreen = useCallback(() => {
    if (!document.fullscreenElement)
      void document.documentElement.requestFullscreen?.().catch(() => undefined);
  }, []);

  const startFallbackCamera = useCallback(() => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraState('unsupported');
      changeMode('pointer');
      setPhase('finished');
      return;
    }
    void navigator.mediaDevices
      .getUserMedia({
        audio: false,
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }
      })
      .then((stream) => {
        streamRef.current = stream;
        setCameraState('ready');
        changeMode('face');
        setPhase('finished');
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play();
        }
      })
      .catch(() => {
        setCameraState('denied');
        changeMode('pointer');
        setPhase('finished');
      });
  }, [changeMode]);

  const beginExperience = () => {
    setCameraState('requesting');
    setPhase('calibration');
    requestFullscreen();

    webgazer
      .saveDataAcrossSessions(false)
      .showVideoPreview(false)
      .showPredictionPoints(false)
      .applyKalmanFilter(true)
      .setRegression('ridge')
      .setGazeListener((data: { x: number; y: number } | null) => {
        if (!data) return;
        const rawX = clamp((data.x / window.innerWidth - 0.5) * 2, -1.6, 1.6);
        const rawY = clamp((data.y / window.innerHeight - 0.5) * 2, -1.6, 1.6);
        const x = smoothedGazeRef.current.x * 0.78 + rawX * 0.22;
        const y = smoothedGazeRef.current.y * 0.78 + rawY * 0.22;
        smoothedGazeRef.current = { x, y };
        setGaze({ x, y });
        const predictionIsOnScreen = Math.abs(x) < 1.18 && Math.abs(y) < 1.2;
        if (predictionIsOnScreen) lastAttentiveAtRef.current = performance.now();
        setIsWatching(
          document.visibilityState === 'visible' &&
            (predictionIsOnScreen || performance.now() - lastAttentiveAtRef.current < 1100)
        );
      });

    void Promise.resolve(webgazer.begin())
      .then(() => {
        webgazerStartedRef.current = true;
        const source = document.getElementById('webgazerVideoFeed') as HTMLVideoElement | null;
        const stream = source?.srcObject as MediaStream | null;
        if (!stream || !videoRef.current) throw new Error('WebGazer video stream is unavailable');
        streamRef.current = stream;
        videoRef.current.srcObject = stream;
        void videoRef.current.play();
        setCameraState('ready');
        changeMode('webgazer');
      })
      .catch(() => startFallbackCamera());
  };

  const trackingActive = phase === 'calibration' || phase === 'advertisement';

  useEffect(() => {
    if (!trackingActive || cameraState !== 'ready') return;
    let cancelled = false;
    let animationFrame = 0;
    let faceLandmarker: FaceLandmarker | null = null;
    let lastVideoTime = -1;
    let lastDetectionTime = 0;
    let misses = 0;

    const renderEyes = (time: number) => {
      if (cancelled) return;
      const video = videoRef.current;
      if (
        faceLandmarker &&
        video &&
        video.readyState >= 2 &&
        video.currentTime !== lastVideoTime &&
        time - lastDetectionTime > 80
      ) {
        lastVideoTime = video.currentTime;
        lastDetectionTime = time;
        const [landmarks] = faceLandmarker.detectForVideo(video, time).faceLandmarks;
        if (landmarks?.length >= 478) {
          misses = 0;
          drawEye(leftEyeRef.current, video, landmarks, [362, 263, 386, 374, 385, 380]);
          drawEye(rightEyeRef.current, video, landmarks, [33, 133, 159, 145, 158, 153]);
          if (modeRef.current !== 'webgazer') {
            const leftIris = averageLandmarks(landmarks, [468, 469, 470, 471, 472]);
            const rightIris = averageLandmarks(landmarks, [473, 474, 475, 476, 477]);
            const leftEye = averageLandmarks(landmarks, [33, 133, 159, 145]);
            const rightEye = averageLandmarks(landmarks, [362, 263, 386, 374]);
            const eyeSpan = Math.max(Math.abs(landmarks[33].x - landmarks[133].x), 0.01);
            const verticalSpan = Math.max(Math.abs(landmarks[159].y - landmarks[145].y), 0.006);
            const gazeX = clamp(
              ((leftIris.x - leftEye.x + rightIris.x - rightEye.x) / 2 / eyeSpan) * 7,
              -1,
              1
            );
            const gazeY = clamp(
              ((leftIris.y - leftEye.y + rightIris.y - rightEye.y) / 2 / verticalSpan) * 3,
              -1,
              1
            );
            const faceCenter = averageLandmarks(landmarks, [1, 4, 9, 152]);
            setGaze({ x: -gazeX, y: gazeY });
            setIsWatching(
              document.visibilityState === 'visible' &&
                document.hasFocus() &&
                faceCenter.x > 0.12 &&
                faceCenter.x < 0.88 &&
                faceCenter.y > 0.1 &&
                faceCenter.y < 0.92 &&
                Math.abs(gazeX) < 0.96 &&
                Math.abs(gazeY) < 0.96
            );
          }
        } else if (modeRef.current !== 'webgazer') {
          misses += 1;
          if (misses > 10) setIsWatching(false);
        }
      }
      animationFrame = requestAnimationFrame(renderEyes);
    };

    void FilesetResolver.forVisionTasks('/models/mediapipe-wasm', false)
      .then((vision) =>
        FaceLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: '/models/face_landmarker.task' },
          runningMode: 'VIDEO',
          numFaces: 1,
          minFaceDetectionConfidence: 0.55,
          minFacePresenceConfidence: 0.55,
          minTrackingConfidence: 0.55
        })
      )
      .then((landmarker) => {
        if (cancelled) {
          landmarker.close();
          return;
        }
        faceLandmarker = landmarker;
        animationFrame = requestAnimationFrame(renderEyes);
      })
      .catch(() => {
        if (modeRef.current !== 'webgazer') changeMode('pointer');
      });

    return () => {
      cancelled = true;
      cancelAnimationFrame(animationFrame);
      faceLandmarker?.close();
    };
  }, [cameraState, changeMode, trackingActive]);

  useEffect(() => {
    if (!trackingActive || attentionMode !== 'pointer') return;
    const update = (event: PointerEvent) => {
      const x = clamp((event.clientX / window.innerWidth - 0.5) * 2, -1, 1);
      const y = clamp((event.clientY / window.innerHeight - 0.5) * 2, -1, 1);
      setGaze({ x, y });
      setIsWatching(Math.abs(x) < 0.95 && Math.abs(y) < 0.95);
    };
    window.addEventListener('pointermove', update);
    return () => window.removeEventListener('pointermove', update);
  }, [attentionMode, trackingActive]);

  useEffect(() => {
    if (phase !== 'advertisement') return;
    let animationFrame = 0;
    let previousTime = performance.now();
    const advance = (time: number) => {
      const elapsed = Math.min(time - previousTime, 100);
      previousTime = time;
      setProgress((current) =>
        isWatching ? Math.min(100, current + elapsed / 100) : Math.max(0, current - elapsed / 42)
      );
      animationFrame = requestAnimationFrame(advance);
    };
    animationFrame = requestAnimationFrame(advance);
    return () => cancelAnimationFrame(animationFrame);
  }, [isWatching, phase]);

  useEffect(() => {
    if (phase !== 'advertisement') return;
    let timeout = 0;
    let messageTimeout = 0;
    const schedule = () => {
      timeout = window.setTimeout(
        () => {
          if (isWatching) {
            const rollback = 5 + Math.round(Math.random() * 7);
            setProgress((current) => Math.max(0, current - rollback));
            setPrankMessage(`Система передумала: −${rollback}%`);
            messageTimeout = window.setTimeout(() => setPrankMessage(''), 1600);
          }
          schedule();
        },
        2600 + Math.random() * 2300
      );
    };
    schedule();
    return () => {
      window.clearTimeout(timeout);
      window.clearTimeout(messageTimeout);
    };
  }, [isWatching, phase]);

  useEffect(() => {
    if (progress < 100 || phase !== 'advertisement') return;
    const timeout = window.setTimeout(() => {
      setPhase('finished');
    }, 600);
    return () => window.clearTimeout(timeout);
  }, [phase, progress]);

  const calibrate = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (attentionMode !== 'webgazer') return;
    webgazer.recordScreenPosition(event.clientX, event.clientY, 'click');
    if (calibrationClicks < 2) {
      setCalibrationClicks((current) => current + 1);
      return;
    }
    setCalibrationClicks(0);
    if (calibrationStep === calibrationPoints.length - 1) setPhase('finished');
    else setCalibrationStep((current) => current + 1);
  };

  const interruptWithAd = () => {
    if (phase !== 'finished' || !initialAdStarted) return;
    setProgress(0);
    setPrankMessage('');
    setIsWatching(true);
    setPhase('advertisement');
  };

  const safeProgress = Number.isFinite(progress) ? progress : 0;
  const slideIndex = Math.min(
    adSlides.length - 1,
    Math.floor(safeProgress / (100 / adSlides.length))
  );
  const activeSlide = adSlides[slideIndex] ?? adSlides[0];
  const secondsRemaining = Math.max(0, Math.ceil((100 - safeProgress) / 10));
  const point = calibrationPoints[calibrationStep];
  const gazeStyle = {
    '--gaze-x': `${gaze.x * 9}px`,
    '--gaze-y': `${gaze.y * 7}px`
  } as CSSProperties;

  return (
    <div
      className={`${styles.experience} ${!isWatching && phase === 'advertisement' ? styles.alarm : ''}`}
      style={gazeStyle}
    >
      <div
        aria-hidden={phase !== 'finished'}
        inert={phase !== 'finished'}
        onClickCapture={interruptWithAd}
      >
        <div className={`${styles.topBanner} ${bannerExpanded ? styles.topBannerExpanded : ''}`}>
          <img
            src="/ads/top-transport-banner.png"
            alt="Поправка 602: снесём транспорт — добавим пробок"
          />
        </div>
        {children}
      </div>
      <video className={styles.cameraFeed} muted playsInline ref={videoRef} />

      {trackingActive && (
        <div className={`${styles.notch} ${styles.notchExpanded}`}>
          <div className={styles.cameraDot} data-active={cameraState === 'ready'} />
          <div className={styles.eye} aria-hidden="true">
            <canvas height="72" ref={leftEyeRef} width="72" />
            {cameraState !== 'ready' && <span className={styles.eyePlaceholder} />}
          </div>
          <div className={styles.eye} aria-hidden="true">
            <canvas height="72" ref={rightEyeRef} width="72" />
            {cameraState !== 'ready' && <span className={styles.eyePlaceholder} />}
          </div>
          <span className={styles.notchStatus}>
            {phase === 'calibration'
              ? 'калибровка взгляда'
              : isWatching
                ? 'контакт есть'
                : 'ГДЕ ГЛАЗА?'}
          </span>
        </div>
      )}

      {phase === 'gate' && (
        <div
          className={styles.gate}
          role="dialog"
          aria-labelledby="attention-gate-title"
          aria-modal="true"
        >
          <div className={styles.gateCard}>
            <span className={styles.gateBadge}>обязательная оптимизация календаря</span>
            <h1 id="attention-gate-title">Сначала — полный экран. Потом — ваши дела.</h1>
            <p>
              Календарю нужен полный экран и камера. После запуска придётся быстро откалибровать
              взгляд — иначе реклама обидится.
            </p>
            <button onClick={beginExperience} type="button">
              Включить экран и камеру
            </button>
            <small>Видео и распознавание остаются в вашем браузере.</small>
          </div>
        </div>
      )}

      {phase === 'calibration' && (
        <div
          className={styles.calibration}
          role="dialog"
          aria-labelledby="calibration-title"
          aria-modal="true"
        >
          <div className={styles.calibrationCopy}>
            <strong id="calibration-title">
              {attentionMode === 'webgazer'
                ? 'Смотрите на мишень и нажмите 3 раза'
                : 'Настраиваем слежение…'}
            </strong>
            <span>
              {attentionMode === 'webgazer'
                ? `Точка ${calibrationStep + 1} из ${calibrationPoints.length}`
                : 'Не двигайтесь. Камера думает.'}
            </span>
          </div>
          {attentionMode === 'webgazer' && (
            <button
              className={styles.calibrationTarget}
              onClick={calibrate}
              style={{ left: `${point.x}%`, top: `${point.y}%` }}
              type="button"
              aria-label={`Калибровочная точка ${calibrationStep + 1}, нажатие ${calibrationClicks + 1} из 3`}
            >
              <span>{3 - calibrationClicks}</span>
            </button>
          )}
        </div>
      )}

      {phase === 'advertisement' && (
        <div
          className={styles.adBackdrop}
          role="dialog"
          aria-labelledby="advertisement-title"
          aria-modal="true"
        >
          <section className={styles.adModal}>
            <header className={styles.modalHeader}>
              <strong id="advertisement-title">Реклама</strong>
              <span>
                {slideIndex + 1}/{adSlides.length}
              </span>
            </header>
            <div className={styles.adStage}>
              <img key={activeSlide.src} src={activeSlide.src} alt={activeSlide.alt} />
            </div>
            <footer className={styles.progressPanel}>
              <div className={styles.attentionCopy} role="status" aria-live="polite">
                <strong>{isWatching ? 'Не отводите взгляд' : 'Взгляд потерян'}</strong>
                <span>{isWatching ? `${secondsRemaining} сек.` : 'Прогресс откатывается'}</span>
              </div>
              <div
                className={styles.progressTrack}
                aria-label="Прогресс рекламы"
                role="progressbar"
                aria-valuemax={100}
                aria-valuemin={0}
                aria-valuenow={Math.round(safeProgress)}
              >
                <span style={{ width: `${safeProgress}%` }} />
                <i>{Math.round(safeProgress)}%</i>
              </div>
              <div className={styles.sensorStatus}>
                <span>
                  {attentionMode === 'webgazer' ? 'WebGazer · откалиброван' : 'MediaPipe · резерв'}
                </span>
                {!isFullscreen && (
                  <button onClick={requestFullscreen} type="button">
                    Вернуть полный экран
                  </button>
                )}
              </div>
            </footer>
          </section>
          {prankMessage && (
            <div className={styles.prankToast} role="status">
              {prankMessage}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
