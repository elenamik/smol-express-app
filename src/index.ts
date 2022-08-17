import express, { Request, Response } from 'express';
import request from 'request';

// URLS
const SOLSCAN = 'https://public-api.solscan.io';
const SOLSCAN_TOKEN_HOLDER = `${SOLSCAN}/token/holders`;
const SOLSCAN_TOKEN_META = `${SOLSCAN}/token/meta`;
const SOLSCAN_ACCOUNT_TOKENS = `${SOLSCAN}/account/tokens`;

interface Token {
  tokenAddress: string
}
interface WalletWithToken {
  walletAddress: string,
  tokens:Token[]
}

interface TokenWithMetaData {
  tokenAddress: string
  meta: {
    name: string,
    symbol: string,
    tokenAuthority:string
  }
}
interface WalletWithTokenMetaData {
  walletAddress: string,
  tokens:TokenWithMetaData[]
}

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

const getMetaForAllTokens = (tokenAddresses:string[]) => {
  const promises = tokenAddresses.map((tokenAddress:string) => getMetaForToken(tokenAddress));
  return Promise.all(promises);
};

const app = express();
const port = 8080;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/getData', async (req: Request, res: Response) => {
  const tokens: string[] = req.body.tokenAddresses;
  const promises = tokens.map((tokenAddress:string) => getOwnerOfToken(tokenAddress));
  const resp = await Promise.all(promises);
  const owners = resp.map((response: any) => response.data.map((holder:any) => holder.owner));
  const walletAddresses = owners.flat(1);

  const walletTokenData: WalletWithToken[] = [];
  for (const walletAddress of walletAddresses) {
    // @ts-ignore
    walletTokenData.push(await getTokensForAddress(walletAddress));
  }

  const walletWithTokenMetaData: WalletWithTokenMetaData[] = [];

  for (const wallet of walletTokenData) {
    const tokenAddresses = wallet.tokens.map((token: Token) => token.tokenAddress);
    // @ts-ignore
    const allTokenMeta: TokenWithMetaData[] = await getMetaForAllTokens(tokenAddresses);
    walletWithTokenMetaData.push({ walletAddress: wallet.walletAddress, tokens: allTokenMeta });
  }

  res.status(200).send({
    walletWithTokenMetaData,
  });
});

// START SERVER
app.listen(port, () => {
  console.log(`server started at http://localhost:${port}`);
});
