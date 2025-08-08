import '@testing-library/jest-dom'

// TextEncoder/TextDecoder polyfill 在 Jest 配置中处理

// Mock MediaPipe
Object.defineProperty(globalThis, 'MediaStream', {
  writable: true,
  value: jest.fn().mockImplementation(() => ({
    getVideoTracks: jest.fn().mockReturnValue([{
      getSettings: jest.fn().mockReturnValue({ deviceId: 'mock-device-id' }),
      stop: jest.fn()
    }]),
    getAudioTracks: jest.fn().mockReturnValue([]),
    getTracks: jest.fn().mockReturnValue([{
      getSettings: jest.fn().mockReturnValue({ deviceId: 'mock-device-id' }),
      stop: jest.fn()
    }]),
    addTrack: jest.fn(),
    removeTrack: jest.fn(),
    clone: jest.fn(),
    active: true,
    id: 'mock-stream-id'
  }))
})

// Mock getUserMedia
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: jest.fn().mockResolvedValue(new MediaStream())
  }
})

// Mock window.Hands for MediaPipe
Object.defineProperty(window, 'Hands', {
  writable: true,
  value: jest.fn().mockImplementation(() => ({
    setOptions: jest.fn(),
    onResults: jest.fn(),
    send: jest.fn(),
    close: jest.fn()
  }))
})

// Mock requestAnimationFrame
Object.defineProperty(globalThis, 'requestAnimationFrame', {
  writable: true,
  value: jest.fn((cb: FrameRequestCallback) => setTimeout(cb, 16))
})

Object.defineProperty(globalThis, 'cancelAnimationFrame', {
  writable: true,
  value: jest.fn()
})

// Mock HTMLVideoElement
Object.defineProperty(HTMLVideoElement.prototype, 'play', {
  writable: true,
  value: jest.fn().mockResolvedValue(undefined)
})

Object.defineProperty(HTMLVideoElement.prototype, 'pause', {
  writable: true,
  value: jest.fn()
})

Object.defineProperty(HTMLVideoElement.prototype, 'load', {
  writable: true,
  value: jest.fn()
})

// Mock HTMLCanvasElement
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  writable: true,
  value: jest.fn().mockReturnValue({
    clearRect: jest.fn(),
    drawImage: jest.fn(),
    fillRect: jest.fn(),
    strokeRect: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    stroke: jest.fn(),
    fill: jest.fn(),
    fillText: jest.fn(),
    strokeText: jest.fn(),
    measureText: jest.fn().mockReturnValue({ width: 100 }),
    arc: jest.fn(),
    arcTo: jest.fn(),
    bezierCurveTo: jest.fn(),
    quadraticCurveTo: jest.fn(),
    closePath: jest.fn(),
    clip: jest.fn(),
    save: jest.fn(),
    restore: jest.fn(),
    scale: jest.fn(),
    rotate: jest.fn(),
    translate: jest.fn(),
    transform: jest.fn(),
    setTransform: jest.fn(),
    resetTransform: jest.fn(),
    createLinearGradient: jest.fn(),
    createRadialGradient: jest.fn(),
    createPattern: jest.fn(),
    getImageData: jest.fn(),
    putImageData: jest.fn(),
    createImageData: jest.fn(),
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    fillStyle: '#000000',
    strokeStyle: '#000000',
    lineWidth: 1,
    lineCap: 'butt',
    lineJoin: 'miter',
    miterLimit: 10,
    lineDashOffset: 0,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    shadowBlur: 0,
    shadowColor: 'rgba(0, 0, 0, 0)',
    font: '10px sans-serif',
    textAlign: 'start',
    textBaseline: 'alphabetic',
    direction: 'inherit'
  })
})

// Suppress console warnings in tests
const originalWarn = console.warn
beforeAll(() => {
  console.warn = (...args: (string | unknown)[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return
    }
    originalWarn.call(console, ...args)
  }
})

afterAll(() => {
  console.warn = originalWarn
})

// Mock request service
jest.mock('../src/services/request', () => {
  return {
    __esModule: true,
    default: jest.fn().mockResolvedValue({ data: {} })
  }
})

// Mock import.meta.env
Object.defineProperty(globalThis, 'import', {
  value: {
    meta: {
      env: {
        VITE_API_BASE_URL: 'http://localhost:3002'
      }
    }
  }
})