import bcrypt from 'bcryptjs';
import sql from 'mssql';
import { connectDB } from './db.js';

const seed = async () => {
    try {
        const pool = await connectDB();
        
        console.log('Seeding data...');

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash('password123', salt);

        // Add Editor
        let res = await pool.request().query("SELECT * FROM Users WHERE Username='editor_mock'");
        let editorId;
        if (res.recordset.length === 0) {
            let insertEditor = await pool.request()
                .input('username', sql.NVarChar, 'editor_mock')
                .input('password', sql.NVarChar, passwordHash)
                .input('role', sql.NVarChar, 'editor')
                .query(`INSERT INTO Users (Username, Password, Role) OUTPUT Inserted.Id VALUES (@username, @password, @role)`);
            editorId = insertEditor.recordset[0].Id;
        } else {
            editorId = res.recordset[0].Id;
        }

        // Add Jurnalist
        res = await pool.request().query("SELECT * FROM Users WHERE Username='jurnalist_mock'");
        let jurnalistId;
        if (res.recordset.length === 0) {
            let insertJurnalist = await pool.request()
                .input('username', sql.NVarChar, 'jurnalist_mock')
                .input('password', sql.NVarChar, passwordHash)
                .input('role', sql.NVarChar, 'jurnalist')
                .query(`INSERT INTO Users (Username, Password, Role) OUTPUT Inserted.Id VALUES (@username, @password, @role)`);
            jurnalistId = insertJurnalist.recordset[0].Id;
        } else {
            jurnalistId = res.recordset[0].Id;
        }

        // Add Article 1
        let contentJson = JSON.stringify([
            { type: 'paragraph', value: 'Aceasta este o zi importantă pentru liceul nostru. Elevii s-au adunat în curte pentru a sărbători începutul noului an școlar.' },
            { type: 'paragraph', value: 'Atmosfera a fost una plină de entuziasm. Profesori și elevi deopotrivă au împărtășit momente speciale, amintiri din vacanță și planuri pentru viitor.' },
            { type: 'image', value: 'https://loremflickr.com/640/480/highschool,education' },
            { type: 'paragraph', value: 'Directorul a ținut un discurs inspirațional, subliniind importanța educației și a implicării în activități extrașcolare.' }
        ]);

        let article1Res = await pool.request()
            .input('title', sql.NVarChar, 'Începutul Noului An Școlar')
            .input('content', sql.NVarChar, contentJson)
            .input('excerpt', sql.NVarChar, 'Elevii și profesorii s-au reunit cu entuziasm...')
            .input('image', sql.NVarChar, 'https://loremflickr.com/640/480/highschool,education')
            .input('date', sql.NVarChar, '13 iunie 2026')
            .input('author', sql.NVarChar, 'editor_mock')
            .input('status', sql.NVarChar, 'finished')
            .input('j1', sql.Int, jurnalistId)
            .query(`
                INSERT INTO Articles (Title, Content, Excerpt, Image, Date, Author, Status, Journalist1Id)
                OUTPUT Inserted.Id
                VALUES (@title, @content, @excerpt, @image, @date, @author, @status, @j1)
            `);
        let article1Id = article1Res.recordset[0].Id;

        // Add Article 2
        let contentJson2 = JSON.stringify([
            { type: 'paragraph', value: 'Echipa de robotică a liceului a obținut locul întâi la competiția națională, demonstrând abilități remarcabile de programare și inginerie.' },
            { type: 'paragraph', value: 'Elevii au lucrat intens timp de câteva luni la proiectul lor, un robot autonom capabil să rezolve labirinturi complexe.' }
        ]);

        let article2Res = await pool.request()
            .input('title', sql.NVarChar, 'Victorie la Competiția de Robotică')
            .input('content', sql.NVarChar, contentJson2)
            .input('excerpt', sql.NVarChar, 'Echipa noastră de robotică a câștigat locul 1.')
            .input('image', sql.NVarChar, 'https://loremflickr.com/640/480/robotics,education')
            .input('date', sql.NVarChar, '12 iunie 2026')
            .input('author', sql.NVarChar, 'jurnalist_mock')
            .input('status', sql.NVarChar, 'started')
            .input('j1', sql.Int, jurnalistId)
            .query(`
                INSERT INTO Articles (Title, Content, Excerpt, Image, Date, Author, Status, Journalist1Id)
                OUTPUT Inserted.Id
                VALUES (@title, @content, @excerpt, @image, @date, @author, @status, @j1)
            `);
        let article2Id = article2Res.recordset[0].Id;

        // Add Comments
        await pool.request()
            .input('artId', sql.Int, article1Id)
            .input('auth', sql.NVarChar, 'editor_mock')
            .input('cont', sql.NVarChar, 'Atenție la acest paragraf, poate ar trebui să adăugăm un citat de la un elev.')
            .input('top', sql.Float, 15.5)
            .input('left', sql.Float, 80.0)
            .query(`
                INSERT INTO Comments (ArticleId, Author, Content, TopPercent, LeftPercent)
                VALUES (@artId, @auth, @cont, @top, @left)
            `);

        await pool.request()
            .input('artId', sql.Int, article1Id)
            .input('auth', sql.NVarChar, 'jurnalist_mock')
            .input('cont', sql.NVarChar, 'Sunt de acord, voi contacta un reprezentant al elevilor.')
            .input('top', sql.Float, 25.0)
            .input('left', sql.Float, 85.0)
            .query(`
                INSERT INTO Comments (ArticleId, Author, Content, TopPercent, LeftPercent)
                VALUES (@artId, @auth, @cont, @top, @left)
            `);

        await pool.request()
            .input('artId', sql.Int, article2Id)
            .input('auth', sql.NVarChar, 'editor_mock')
            .input('cont', sql.NVarChar, 'Mai multe detalii despre robotul construit ar fi binevenite aici.')
            .input('top', sql.Float, 30.0)
            .input('left', sql.Float, 90.0)
            .query(`
                INSERT INTO Comments (ArticleId, Author, Content, TopPercent, LeftPercent)
                VALUES (@artId, @auth, @cont, @top, @left)
            `);

        console.log('Seeding completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Seeding failed:', err);
        process.exit(1);
    }
};

seed();
