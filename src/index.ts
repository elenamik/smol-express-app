import express, { Application, Request, Response } from 'express'
const app = express();
const port = 8080;


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// define a route handler for the default home page
app.get( "/", async ( req: Request, res: Response ): Promise<Response> => {
    return res.status(200).send({
        message: "Hello World!",
    });
} );

// start the Express server
app.listen( port, () => {
    console.log( `server started at http://localhost:${ port }` );
} );