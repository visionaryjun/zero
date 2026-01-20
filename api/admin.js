import { sql } from '@vercel/postgres';

export default async function handler(request, response) {
    const { password } = request.query;

    if (!password || password !== process.env.ADMIN_PASSWORD) {
        return response.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const { rows } = await sql`SELECT * FROM waitlist ORDER BY created_at DESC;`;
        return response.status(200).json(rows);
    } catch (error) {
        console.error('Admin fetch error:', error);
        return response.status(500).json({ error: 'Internal server error', details: error.message });
    }
}
