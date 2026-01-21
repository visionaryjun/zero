import { sql } from '@vercel/postgres';

export default async function handler(request, response) {
    const { password } = request.query;

    if (!password || password !== process.env.ADMIN_PASSWORD) {
        return response.status(401).json({ error: 'Unauthorized' });
    }

    // Check configuration
    if (!process.env.POSTGRES_URL) {
        console.error('Missing POSTGRES_URL environment variable');
        return response.status(500).json({
            error: 'Database configuration missing',
            details: 'Please connect Vercel Postgres/Neon storage in the Vercel Dashboard.'
        });
    }

    console.log('API: Waitlist request received. Using database:', process.env.POSTGRES_URL.split('@')[1] || 'URL masked');
    console.log('Admin API: Fetching submissions. Auth success.');

    try {
        // Check if table exists first by querying information_schema
        const tableCheck = await sql`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'waitlist'
            );
        `;

        if (!tableCheck.rows[0].exists) {
            return response.status(200).json([]);
        }

        const { rows } = await sql`SELECT * FROM waitlist ORDER BY created_at DESC;`;
        return response.status(200).json(rows);
    } catch (error) {
        console.error('Admin fetch error:', error);
        return response.status(500).json({
            error: 'Database connection error',
            details: error.message
        });
    }
}
