import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useRef, useState } from 'react'

export default function SchedulePage() {
	const { data } = useQuery({ queryKey: ['template'], queryFn: api.getScheduleTemplate as any })
	const [assistantId, setAssistantId] = useState('')
	const inputRef = useRef<HTMLInputElement>(null)

	return (
		<div style={{ display: 'grid', gap: 12 }}>
			<h2>Schedule Calls</h2>
			<div>
				<h4>Template</h4>
				<pre>{JSON.stringify(data, null, 2)}</pre>
			</div>
			<div>
				<label>Assistant Id</label>
				<input value={assistantId} onChange={e => setAssistantId(e.target.value)} placeholder="assistant id" />
			</div>
			<div>
				<input type="file" ref={inputRef} accept=".xlsx" />
				<button onClick={async () => {
					const file = inputRef.current?.files?.[0]
					if (!file) return
					await api.scheduleUpload(assistantId, file)
					alert('Uploaded scheduling file')
				}}>Upload & Schedule</button>
			</div>
		</div>
	)
}

