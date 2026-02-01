import fs from 'fs';
import path from 'path';
import pg from 'pg';
const { Pool } = pg;

const envPath = path.join(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w_]+)\s*=\s*(.*)?\s*$/);
    if (match) {
        let value = match[2] || '';
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        envVars[match[1]] = value;
    }
});

const pool = new Pool({
    connectionString: envVars.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function testInsert() {
    try {
        console.log('Testing insert...');
        const res = await pool.query(`
            INSERT INTO expenses (user_id, title, amount, date, category, note)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `, ['test-user', 'Test Expense', 10.50, new Date(), 'Food', 'Test Note']);

        console.log('✅ Insert successful:', res.rows[0]);

        // Clean up
        await pool.query('DELETE FROM expenses WHERE id = $1', [res.rows[0].id]);
        console.log('Cleaned up test record.');

    } catch (e) {
        console.error('❌ Insert failed:', e);
    } finally {
        await pool.end();
    }
}

testInsert();
