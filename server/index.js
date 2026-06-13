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

const generateArticles = (count = 12) => {
  const generated = [];
  let titles = faker.helpers.shuffle([...schoolTitles]);

  for (let i = 0; i < count; i++) {
    if (titles.length === 0) titles = faker.helpers.shuffle([...schoolTitles]);
    const title = titles.pop();

    const selectedParagraphs = faker.helpers.arrayElements(schoolParagraphs, 2);
    const content = selectedParagraphs.join('\n\n') + '\n\n' + faker.lorem.paragraphs({ min: 3, max: 6 }, '\n\n');

    generated.push({
      id: faker.string.uuid(),
      title: title,
      date: faker.date.recent({ days: 15 }).toLocaleDateString('ro-RO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      author: faker.person.fullName(),
      image: faker.image.urlLoremFlickr({ category: 'highschool,education' }),
      excerpt: selectedParagraphs[0],
      content: content
    });
  }
  return generated;
};

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
const articles = generateArticles(12);
const trendingTopics = generateSidebarItems(trendingTitles, 6);
const officialNews = generateSidebarItems(officialTitles, 5);

// API Routes
app.get('/api/articles', (req, res) => {
  res.json(articles);
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
