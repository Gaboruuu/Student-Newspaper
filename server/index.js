import express from 'express';
import cors from 'cors';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcryptjs';
import sql from 'mssql';
import { connectDB } from './db.js';

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

connectDB().catch(console.error);

faker.seed(456);

const schoolTitles = [
  "Echipa de baschet câștigă campionatul județean după o finală dramatică",
  "Interviu exclusiv: Noul profesor de istorie ne dezvăluie pasiunile sale",
  "Balul Bobocilor: Cele mai spectaculoase momente ale serii",
  "Olimpiada de Matematică: Elevii noștri se întorc cu medalii de aur",
  "Dezbatere încinsă în Consiliul Elevilor despre noul regulament școlar",
  "Expoziția de artă a claselor a XI-a atrage sute de vizitatori",
  "Renovarea sălii de sport s-a încheiat. Când au loc primele meciuri?",
  "Clubul de robotică prezintă noul lor proiect pentru competiția națională",
  "Cum să te pregătești eficient pentru Bacalaureat: Sfaturi de la profesori",
  "Excursia de primăvară: Destinațiile preferate de elevii claselor a X-a",
  "Târgul de prăjituri caritabil strânge fonduri pentru adăpostul de animale",
  "Concursul de talente a descoperit noi stele în rândul elevilor"
];

const schoolParagraphs = [
  "Atmosfera a fost una incendiară, iar susținătorii din tribune nu s-au oprit din scandări pe tot parcursul evenimentului. Emoțiile au fost la cote maxime, dar perseverența a dat roade.",
  "Reprezentanții noștri s-au pregătit intens săptămâni la rând, sacrificând timpul liber pentru a ajunge la aceste rezultate excepționale. Efortul lor este cu adevărat demn de admirație.",
  "Proiectul a fost inițiat din dorința de a aduce o schimbare pozitivă și a implica cât mai mulți tineri în activități extracurriculare care să le dezvolte creativitatea.",
  "Profesorii coordonatori s-au declarat extrem de mândri de munca depusă. „Nu este vorba doar despre câștig, ci despre experiența și lecțiile învățate pe parcurs”, a declarat unul dintre ei.",
  "Evenimentul s-a încheiat cu aplauze prelungite, confirmând încă o dată că talentul și pasiunea, atunci când sunt susținute, duc întotdeauna către succes."
];

const trendingTitles = [
  "Meniu nou la cantină: Păreri împărțite",
  "Zvonuri despre locația Miss Boboc",
  "Pauze mai lungi? Ce spune conducerea",
  "Profesorul de mate a venit cu bicicleta",
  "Trendul misterios de pe TikTok din pauza mare",
  "Farsa claselor a XII-a: Cum au reacționat profesorii"
];

const officialTitles = [
  "Ministerul Educației: Calendarul Examenelor Naționale",
  "Ordin Inspectorat: Noi norme de siguranță",
  "Structura anului școlar a fost modificată",
  "Bursa de merit: Condiții noi de acordare",
  "Avertizare meteorologică: Școlile ar putea fi închise",
  "Rezultate simulare Evaluare Națională publicate"
];

const generateSidebarItems = (titlesArray, count = 5) => {
  const items = [];
  let titles = faker.helpers.shuffle([...titlesArray]);

  for (let i = 0; i < count; i++) {
    if (titles.length === 0) titles = faker.helpers.shuffle([...titlesArray]);
    const title = titles.pop();

    items.push({
      id: faker.string.uuid(),
      title: title,
      date: faker.date.recent({ days: 3 }).toLocaleDateString('ro-RO', {
        month: 'short',
        day: 'numeric'
      })
    });
  }
  return items;
}

// Generate static data once on startup
const trendingTopics = generateSidebarItems(trendingTitles, 6);
const officialNews = generateSidebarItems(officialTitles, 5);

// API Routes
app.get('/api/articles', async (req, res) => {
  try {
    const { username, role } = req.query;
    const request = new sql.Request();

    let queryStr = `
      SELECT 
        a.*, 
        u1.Username as Journalist1Username,
        u2.Username as Journalist2Username
      FROM Articles a
      LEFT JOIN Users u1 ON a.Journalist1Id = u1.Id
      LEFT JOIN Users u2 ON a.Journalist2Id = u2.Id
    `;

    if (role === 'editor' && username) {
      request.input('username', sql.NVarChar, username);
      queryStr += ` WHERE a.Author = @username`;
    } else if ((role === 'jurnalist' || role === 'journalist') && username) {
      request.input('username', sql.NVarChar, username);
      queryStr += ` WHERE u1.Username = @username OR u2.Username = @username`;
    } else {
      queryStr += ` WHERE a.Status = 'finished'`;
    }

    queryStr += ` ORDER BY a.Id DESC`;

    const result = await request.query(queryStr);
    
    const fetchedArticles = result.recordset.map(row => ({
      id: row.Id,
      title: row.Title,
      content: row.Content,
      excerpt: row.Excerpt,
      image: row.Image,
      date: row.Date,
      author: row.Author,
      journalist1Id: row.Journalist1Id,
      journalist2Id: row.Journalist2Id,
      journalist1Username: row.Journalist1Username,
      journalist2Username: row.Journalist2Username,
      status: row.Status
    }));

    res.json(fetchedArticles);
  } catch (err) {
    console.error('Error fetching articles:', err);
    res.status(500).json({ error: 'Eroare la preluarea articolelor.' });
  }
});

app.post('/api/articles', async (req, res) => {
  try {
    const { title, content, excerpt, image, author } = req.body;
    
    if (!title || !author) {
      return res.status(400).json({ error: 'Titlul și autorul sunt obligatorii.' });
    }

    const date = new Date().toLocaleDateString('ro-RO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Provide default placeholders for empty content to match frontend expectations
    const defContent = content || 'Conținut articol...';
    const defExcerpt = excerpt || 'Articol în curs de redactare...';
    const defImage = image || faker.image.urlLoremFlickr({ category: 'highschool,education' });

    await sql.query`
      INSERT INTO Articles (Title, Content, Excerpt, Image, Date, Author, Status)
      VALUES (${title}, ${defContent}, ${defExcerpt}, ${defImage}, ${date}, ${author}, 'started')
    `;

    res.status(201).json({ message: 'Articol creat cu succes.' });
  } catch (err) {
    console.error('Error creating article:', err);
    res.status(500).json({ error: 'Eroare la crearea articolului.' });
  }
});

app.put('/api/articles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, journalist1Id, journalist2Id, status } = req.body;

    if (!title || !status) {
      return res.status(400).json({ error: 'Titlul și statusul sunt obligatorii.' });
    }

    const j1Id = journalist1Id || null;
    const j2Id = journalist2Id || null;

    await sql.query`
      UPDATE Articles
      SET 
        Title = ${title},
        Journalist1Id = ${j1Id},
        Journalist2Id = ${j2Id},
        Status = ${status}
      WHERE Id = ${id}
    `;

    res.json({ message: 'Articol actualizat cu succes.' });
  } catch (err) {
    console.error('Error updating article:', err);
    res.status(500).json({ error: 'Eroare la actualizarea articolului.' });
  }
});

app.delete('/api/articles/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await sql.query`DELETE FROM Articles WHERE Id = ${id}`;
    res.json({ message: 'Articol șters cu succes.' });
  } catch (err) {
    console.error('Error deleting article:', err);
    res.status(500).json({ error: 'Eroare la ștergerea articolului.' });
  }
});

app.get('/api/users/journalists', async (req, res) => {
  try {
    const result = await sql.query`SELECT Id, Username FROM Users WHERE Role = 'jurnalist' OR Role = 'journalist'`;
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching journalists:', err);
    res.status(500).json({ error: 'Eroare la preluarea jurnaliștilor.' });
  }
});

app.get('/api/articles/trending', (req, res) => {
  res.json(trendingTopics);
});

app.get('/api/articles/official', (req, res) => {
  res.json(officialNews);
});

// Auth Routes
app.post('/api/register', async (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({ error: 'Toate câmpurile sunt obligatorii.' });
    }

    if (role === 'admin') {
      return res.status(403).json({ error: 'Nu puteți înregistra un cont de admin.' });
    }

    // Check if user exists
    const checkUser = await sql.query`SELECT Id FROM Users WHERE Username = ${username}`;
    if (checkUser.recordset.length > 0) {
      return res.status(400).json({ error: 'Numele de utilizator există deja.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await sql.query`
      INSERT INTO Users (Username, Password, Role) 
      VALUES (${username}, ${hashedPassword}, ${role})
    `;

    res.status(201).json({ message: 'Utilizator înregistrat cu succes.' });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Eroare la înregistrare.' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Numele de utilizator și parola sunt obligatorii.' });
    }

    const result = await sql.query`SELECT Id, Username, Password, Role FROM Users WHERE Username = ${username}`;
    const user = result.recordset[0];

    if (!user) {
      return res.status(401).json({ error: 'Credențiale invalide.' });
    }

    const isMatch = await bcrypt.compare(password, user.Password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Credențiale invalide.' });
    }

    // Usually we would return a JWT here. For simplicity, just returning user info (no password).
    res.json({
      message: 'Autentificare reușită.',
      user: {
        id: user.Id,
        username: user.Username,
        role: user.Role
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Eroare la autentificare.' });
  }
});


app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});
