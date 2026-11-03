require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Koneksi PostgreSQL
const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

// Test koneksi
pool.connect()
    .then(() => console.log('✅ Terkoneksi ke database PostgreSQL'))
    .catch(err => console.error('❌ Gagal konek database:', err.message));

// ===== API ENDPOINTS =====

// Ambil semua data KOL
app.get('/api/kol', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM kol ORDER BY nama ASC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Ambil metric per KOL
app.get('/api/metric/:kol_id', async (req, res) => {
    try {
        const { kol_id } = req.params;
        const result = await pool.query(
            'SELECT * FROM metric WHERE kol_id = $1 ORDER BY tanggal ASC',
            [kol_id]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Ambil ringkasan metric (untuk chart)
app.get('/api/ringkasan', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                k.nama,
                k.platform,
                k.followers,
                COALESCE(AVG(m.engagement_rate), 0) as avg_engagement,
                COALESCE(SUM(m.reach), 0) as total_reach,
                COALESCE(SUM(m.impressions), 0) as total_impressions
            FROM kol k
            LEFT JOIN metric m ON k.id = m.kol_id
            GROUP BY k.id, k.nama, k.platform, k.followers
            ORDER BY avg_engagement DESC
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Jalankan server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server jalan di http://localhost:${PORT}`);
});