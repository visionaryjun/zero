import { sql } from '@vercel/postgres';

export default async function handler(request, response) {
    const { password } = request.query;

    if (!password || password !== process.env.ADMIN_PASSWORD) {
        return response.status(401).json({ error: 'Unauthorized' });
    }

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
