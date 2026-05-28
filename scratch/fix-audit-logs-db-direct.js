import pg from 'pg';
const { Client } = pg;

async function fixAuditLogsId() {
    // Constructing URL using the active Supabase ID snmsvixlskwstvpuksbw
    const url = 'postgresql://postgres.snmsvixlskwstvpuksbw:kLXmnB3sBA86wVSL@aws-1-ap-south-1.pooler.supabase.com:6543/postgres';
    console.log("Connecting to PostgreSQL database via pooler...");
    
    const client = new Client({
        connectionString: url
    });

    try {
        await client.connect();
        console.log("Connected successfully. Running ALTER TABLE script...");
        
        const checkRes = await client.query(`
            SELECT column_name, column_default, is_nullable, data_type
            FROM information_schema.columns
            WHERE table_name = 'audit_logs' AND column_name = 'id';
        `);
        console.log("Current column info:", checkRes.rows[0]);

        await client.query(`
            ALTER TABLE public.audit_logs 
            ALTER COLUMN id SET DEFAULT gen_random_uuid();
        `);
        console.log("Table altered successfully!");

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
