import express, { Express, json, Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app: Express = express();
const port = process.env.PORT;

app.use(json());

app.post('/api/v1/movement', (req, res, next) => {
  const data = req.body;
  console.log(data);
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