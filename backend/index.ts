import express, { Express, json, Request, Response } from 'express';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import dotenv from 'dotenv';
import path from 'path';
const creds = require('./config.json');

dotenv.config();

const app: Express = express();
const port = process.env.PORT;

type Row = {
  date: string,
  time: string,
  intensity: string,
  type: string,
  position: string
}

app.use(json());

app.post('/api/v1/movement', async (req, res, next) => {
  const data = req.body;

  const doc = new GoogleSpreadsheet('1JflNS-6HDPdMXUcatkYw_qa0wY8C-dwcM7lYZThfNQQ');
  
  // Authentication
  await doc.useServiceAccountAuth(creds); 
  await doc.loadInfo();

  const sheet = doc.sheetsByIndex[0];
  await sheet.addRow(data);

  return res.sendStatus(200);
});

app.get('/api/v1/movement', async (req, res, next) => {

  const doc = new GoogleSpreadsheet('1JflNS-6HDPdMXUcatkYw_qa0wY8C-dwcM7lYZThfNQQ');
  
  // Authentication
  await doc.useServiceAccountAuth(creds); 
  await doc.loadInfo();

  const sheet = doc.sheetsByIndex[0];
  const rows = await sheet.getRows();
  
  const now = new Date();
  const start = now.getDate() - now.getDay() - 6;  
  const startDate = new Date(now.setDate(start));
  const filtered = rows.filter(row => new Date(row.date) > startDate).map(({date, time, intensity, type, position}) => ({
    date, time, intensity, type, position
  })).sort((a: Row, b: Row) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const grouped = filtered.reduce((acc: Record<string, Pick<Row, Exclude<keyof Row, Row['date']>>[]>, {date, time, intensity, type, position}: Row) => {
    (acc[date] = acc[date] || []).push({time, intensity, type, position,});
    return acc;
  }, {});

  let dayCount = 0;

  while (dayCount <= 7) {
    const date = now.getDate() + 1;
    const dateString = new Date(now.setDate((date))).toDateString();
    console.log(dateString);
    if (!Object.keys(grouped).includes(dateString)) {
      grouped[dateString] = [];
    }
    dayCount = dayCount + 1;
  }

  return res.status(200).send(grouped);
});

app.use(function(req, res, next) {
  req.headers['if-none-match'] = 'no-match-for-this';
  next();    
});

// Set the static files directory
const frontendBuildDir = process.env.NODE_ENV === 'development' ? '/dist/frontend' : '/frontend';
app.use('/', express.static(path.resolve(`${__dirname}${frontendBuildDir}`)));

// For any other routes, serve the UI
app.use('*', (req: Request, res: Response): void => {
    // Send index.html from the static files directory
    res.sendFile(path.resolve(`${__dirname}${frontendBuildDir}/index.html`));
});

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});