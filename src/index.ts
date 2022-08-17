import express, { Request, Response } from 'express';
import request from 'request';

// URLS
const SOLSCAN = 'https://public-api.solscan.io';
const SOLSCAN_TOKEN_HOLDER = `${SOLSCAN}/token/holders`;

const makeAPICall = (url:string) => new Promise((resolve, reject) => {
  request(url, { json: true }, (err, res, body) => {
    if (err) reject(err);
    resolve(body);
  });
});

const app = express();
const port = 8080;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HOME
app.get('/owners', async (req: Request, res: Response) => {
  const tokens: string[] = req.body.tokenAddresses;

  const promises = tokens.map((tokenAddress:string) => {
    const url = `${SOLSCAN_TOKEN_HOLDER}?tokenAddress=${tokenAddress}`;

    return makeAPICall(url);
  });
  const resp = await Promise.all(promises);
  const owners = resp.map((response: any) => response.data.map((holder:any) => holder.owner));

  res.status(200).send({
    owners,
  });
});

// START SERVER
app.listen(port, () => {
  console.log(`server started at http://localhost:${port}`);
});
