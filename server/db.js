import sql from 'mssql';

const connectionString = "Data Source=.;Initial Catalog=ZiarDB;User ID=gaboruu;Password=gabi123;TrustServerCertificate=True";

export const connectDB = async () => {
    try {
        const pool = await sql.connect(connectionString);
        console.log('Connected to SQL Server successfully.');

        // Initialize Users table
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Users' and xtype='U')
            CREATE TABLE Users (
                Id INT IDENTITY(1,1) PRIMARY KEY,
                Username NVARCHAR(255) NOT NULL UNIQUE,
                Password NVARCHAR(255) NOT NULL,
                Role NVARCHAR(50) NOT NULL
            )
        `);
        console.log('Users table initialized.');
        return pool;
    } catch (err) {
        console.error('Database connection failed:', err);
        throw err;
    }
};

export const getPool = () => sql;
