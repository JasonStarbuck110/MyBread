const BACKEND_URL = 'https://mybread-7lmg.onrender.com'

export default {
	async fetch(request) {
		const incoming = new URL(request.url)

		if (!incoming.pathname.startsWith('/api/')) {
			return new Response('Not found', { status: 404 })
		}

		const upstream = new URL(incoming.pathname + incoming.search, BACKEND_URL)
		try {
			return await fetch(new Request(upstream.toString(), request), {
				redirect: 'manual'
			})
		} catch (error) {
			console.error('Backend proxy failed:', error)

			return Response.json(
				{ error: 'Backend API temporarily unavailable' },
				{ status: 502 }
			)
		}
	}
}