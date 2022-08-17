import express, { Request, Response } from 'express';
import request from 'request';

// URLS
const SOLSCAN = 'https://public-api.solscan.io';
const SOLSCAN_TOKEN_HOLDER = `${SOLSCAN}/token/holders`;
const SOLSCAN_TOKEN_META = `${SOLSCAN}/token/meta`;
const SOLSCAN_ACCOUNT_TOKENS = `${SOLSCAN}/account/tokens`;

const getOwnerOfToken = (tokenAddress:string) => new Promise((resolve, reject) => {
  const url = `${SOLSCAN_TOKEN_HOLDER}?tokenAddress=${tokenAddress}`;
  request(url, { json: true }, (err, res, body) => {
    if (err) reject(err);
    resolve(body);
  });
});

const getTokensForAddress = (walletAddress:string) => new Promise((resolve, reject) => {
  const url = `${SOLSCAN_ACCOUNT_TOKENS}?account=${walletAddress}`;
  request(url, { json: true }, (err, res, body) => {
    if (err) reject(err);
    resolve({ walletAddress, tokens: body });
  });
});

const getMetaForToken = (tokenAddress:string) => new Promise((resolve, reject) => {
  const url = `${SOLSCAN_TOKEN_META}?tokenAddress=${tokenAddress}`;
  request(url, { json: true }, (err, res, body) => {
    if (err) reject(err);
    resolve({ tokenAddress, meta: body });
  });
});

const app = express();
const port = 8080;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/owners', async (req: Request, res: Response) => {
  const tokens: string[] = req.body.tokenAddresses;
  const promises = tokens.map((tokenAddress:string) => getOwnerOfToken(tokenAddress));
  const resp = await Promise.all(promises);
  const owners = resp.map((response: any) => response.data.map((holder:any) => holder.owner));
  res.status(200).send({
    walletAddresses: owners.flat(1),
  });
});

app.get('/tokens', async (req: Request, res: Response) => {
  const tokens: string[] = req.body.walletAddresses;
  const tokenReqs = tokens.map((walletAddress:string) => getTokensForAddress(walletAddress));
  const tokensForAllWallets = await Promise.all(tokenReqs);

  // eslint-disable-next-line max-len
  const completeTokenData = tokensForAllWallets.map(async (tokensPerWallet: {wallet:string, tokens:{tokenAddress:string}[]}) => {
    const tokenAddresses = tokensPerWallet.tokens.map((token:any) => token.tokenAddress);
    const metaReqs = tokenAddresses.map((tokenAddress:string) => getMetaForToken(tokenAddress));
    const allTokenMeta = await Promise.all(metaReqs);
    return {
      walletAddress: tokensPerWallet.wallet,
      allTokenMeta,
    };
  });

  res.status(200).send({
    completeTokenData,
  });
});

// START SERVER
app.listen(port, () => {
  console.log(`server started at http://localhost:${port}`);
});
