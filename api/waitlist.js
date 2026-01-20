import { sql } from '@vercel/postgres';

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method not allowed' });
    }

    const { contact } = request.body;

    if (!contact) {
        return response.status(400).json({ error: 'Contact information is required' });
    }

    // Basic validation (email or phone)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[\d\s\-\+\(\)]{8,}$/;

    if (!emailRegex.test(contact) && !phoneRegex.test(contact)) {
        return response.status(400).json({ error: 'Invalid contact format' });
    }

    const contactType = emailRegex.test(contact) ? 'email' : 'phone';

    try {
        // Check if table exists, create if not
        await sql`
      CREATE TABLE IF NOT EXISTS waitlist (
        id SERIAL PRIMARY KEY,
        contact VARCHAR(255) NOT NULL,
        contact_type VARCHAR(10) NOT NULL,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

        // Insert data
        // Use x-forwarded-for for client IP behind Vercel proxy
        const ip = request.headers['x-forwarded-for'] || request.socket.remoteAddress;
        const userAgent = request.headers['user-agent'];

        await sql`
      INSERT INTO waitlist (contact, contact_type, ip_address, user_agent)
      VALUES (${contact}, ${contactType}, ${ip}, ${userAgent});
    `;

        return response.status(200).json({ success: true, message: 'Successfully joined waitlist' });
    } catch (error) {
        console.error('Waitlist submission error:', error);
        return response.status(500).json({ error: 'Internal server error', details: error.message });
    }
}
