import express, { Request, Response } from 'express';

const app = express();
const port = 8080;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HOME
app.get('/', async (req: Request, res: Response): Promise<Response> => res.status(200).send({
  message: 'Hello World!',
}));

// MORE ROUTES
const testRouter = express.Router();
testRouter.route('/').get((req: Request, res: Response) => {
  res.status(200)
    .send({ message: 'hello test' });
});
testRouter.route('/:testId').get((req: Request, res: Response) => {
  res.status(200)
    .send({ message: `hello user id ${req.params.testId}` });
});
app.use('/test', testRouter);

// START SERVER
app.listen(port, () => {
  console.log(`server started at http://localhost:${port}`);
});
