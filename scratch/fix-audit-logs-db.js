import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const { Client } = pg;

async function fixAuditLogsId() {
    console.log("Connecting to PostgreSQL database...");
    const client = new Client({
        connectionString: process.env.DATABASE_URL
    });

    try {
        await client.connect();
        console.log("Connected successfully. Running ALTER TABLE script...");
        
        // Let's check the current schema details of audit_logs.id column
        const checkRes = await client.query(`
            SELECT column_name, column_default, is_nullable, data_type
            FROM information_schema.columns
            WHERE table_name = 'audit_logs' AND column_name = 'id';
        `);
        console.log("Current column info:", checkRes.rows[0]);

        // Alter table to set default to gen_random_uuid()
        await client.query(`
            ALTER TABLE public.audit_logs 
            ALTER COLUMN id SET DEFAULT gen_random_uuid();
        `);
        console.log("Table altered successfully!");

        // Let's verify the column defaults again
        const checkResPost = await client.query(`
            SELECT column_name, column_default, is_nullable, data_type
            FROM information_schema.columns
            WHERE table_name = 'audit_logs' AND column_name = 'id';
        `);
        console.log("Updated column info:", checkResPost.rows[0]);

    } catch (err) {
        console.error("Error occurred while altering the table:", err);
    } finally {
        await client.end();
    }
}

fixAuditLogsId();
