import { onRequest } from "firebase-functions/v2/https";
import express from 'express';
import cors from 'cors';


// // date time
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("Australia/Sydney");


const app = express();

app.use(cors({ origin: true }));
app.use(express.json());
app.use((req, res, next) => {
    console.log("");
    console.log("");
    // console.log(`******************** Server time: ${dayjs().tz().format('hh:mm A, DD MMM YYYY, UTCZ')} ********************`);
    console.log(`******************** endpoint: ${req.path} ********************`);
    console.log('req.headers: \n', req.headers);
    console.log('req.body: \n', req.body);
    console.log(``);
    next();
});


app.get('/', (req, res) => {
    res.send('This is Track Invest.');
});

exports.app = onRequest(app);