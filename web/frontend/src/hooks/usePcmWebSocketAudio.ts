import { useCallback, useEffect, useRef, useState } from 'react'

// Simple PCM (s16le, mono, 16kHz) WebSocket audio player using Web Audio API.
// If the AudioContext sampleRate differs, we resample by naive linear interpolation.

function int16ToFloat32(int16: Int16Array): Float32Array {
	const float32 = new Float32Array(int16.length)
	for (let i = 0; i < int16.length; i++) {
		float32[i] = int16[i] / 32768
	}
	return float32
}

function resampleLinear(input: Float32Array, inRate: number, outRate: number): Float32Array {
	if (inRate === outRate) return input
	const ratio = outRate / inRate
	const outLength = Math.floor(input.length * ratio)
	const output = new Float32Array(outLength)
	for (let i = 0; i < outLength; i++) {
		const t = i / ratio
		const i0 = Math.floor(t)
		const i1 = Math.min(i0 + 1, input.length - 1)
		const frac = t - i0
		output[i] = input[i0] * (1 - frac) + input[i1] * frac
	}
	return output
}

export function usePcmWebSocketAudio(url?: string) {
	const wsRef = useRef<WebSocket | null>(null)
	const ctxRef = useRef<AudioContext | null>(null)
	const gainRef = useRef<GainNode | null>(null)
	const sourceQueueRef = useRef<Float32Array[]>([])
	const [connected, setConnected] = useState(false)
	const [muted, setMuted] = useState(false)
	const [volume, setVolume] = useState(1)
	const targetRateRef = useRef(16000)

	useEffect(() => {
		if (!gainRef.current) return
		gainRef.current.gain.value = muted ? 0 : volume
	}, [muted, volume])

	const ensureAudio = useCallback(async () => {
		if (!ctxRef.current) {
			ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
			gainRef.current = ctxRef.current.createGain()
			gainRef.current.connect(ctxRef.current.destination)
		}
		if (ctxRef.current.state === 'suspended') await ctxRef.current.resume()
	}, [])

	// Simple scheduler: periodically drain queued frames into small BufferSource chunks
	useEffect(() => {
		let raf = 0
		const pump = () => {
			const ctx = ctxRef.current
			if (ctx && sourceQueueRef.current.length) {
				const input = sourceQueueRef.current.shift()!
				const desiredRate = targetRateRef.current
				let data = input
				if (ctx.sampleRate !== desiredRate) {
					data = resampleLinear(input, desiredRate, ctx.sampleRate)
				}
				const buf = ctx.createBuffer(1, data.length, ctx.sampleRate)
				buf.copyToChannel(data, 0)
				const node = ctx.createBufferSource()
				node.buffer = buf
				node.connect(gainRef.current!)
				node.start()
			}
			raw()
		}
		const raw = () => { raf = requestAnimationFrame(pump) }
		raw()
		return () => cancelAnimationFrame(raf)
	}, [])

	const connect = useCallback(async () => {
		if (!url) return
		await ensureAudio()
		if (wsRef.current) { try { wsRef.current.close() } catch {} }
		const ws = new WebSocket(url)
		ws.binaryType = 'arraybuffer'
		ws.onopen = () => setConnected(true)
		ws.onclose = () => setConnected(false)
		ws.onerror = () => setConnected(false)
		ws.onmessage = (evt) => {
			if (evt.data instanceof ArrayBuffer) {
				const int16 = new Int16Array(evt.data)
				const f32 = int16ToFloat32(int16)
				sourceQueueRef.current.push(f32)
			} else if (evt.data instanceof Blob) {
				(evt.data as Blob).arrayBuffer().then(ab => {
					const int16 = new Int16Array(ab)
					const f32 = int16ToFloat32(int16)
					sourceQueueRef.current.push(f32)
				})
			} else {
				// control message JSON? ignore for now
			}
		}
		wsRef.current = ws
	}, [url, ensureAudio])

	const disconnect = useCallback(() => {
		if (wsRef.current) { try { wsRef.current.close() } catch {} }
		wsRef.current = null
		setConnected(false)
	}, [])

	return {
		connected,
		muted,
		volume,
		setMuted,
		setVolume,
		connect,
		disconnect,
	}
}

