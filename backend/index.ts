import express, { Express, json, Request, Response } from 'express';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import dotenv from 'dotenv';
import path from 'path';
const creds = require('./config.json');

dotenv.config();

const app: Express = express();
const port = process.env.PORT;

app.use(json());

app.post('/api/v1/movement', async (req, res, next) => {
  const data = req.body;
  console.log(data);

  const doc = new GoogleSpreadsheet('1JflNS-6HDPdMXUcatkYw_qa0wY8C-dwcM7lYZThfNQQ');
  
  // Authentication
  await doc.useServiceAccountAuth(creds); 
  await doc.loadInfo();
  console.log(doc.title);

  const sheet = doc.sheetsByIndex[0];
  const newRow = await sheet.addRow(data);
  console.log(newRow);

  return res.sendStatus(200);
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