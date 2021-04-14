const express = require('express')
require('dotenv').config()
const cors = require('cors')
const fileUpload = require('express-fileupload');//fileupload
const MongoClient = require('mongodb').MongoClient;

const app = express();
app.use(cors())
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
//for file upload
app.use(express.static('doctors'));
app.use(fileUpload());

const port = process.env.PORT || 5000;

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zqmy8.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

client.connect(err => {
  const appointmentCollection = client.db("dentalPro").collection("appointment");
  const doctorCollection = client.db("dentalPro").collection("doctors");
  //create appointment
  app.post('/addAppointment',(req, res)=>{
      const appointment = req.body;
      console.log(appointment)
      appointmentCollection.insertOne(appointment)
      .then( result =>{
          res.send(result.insertedCount > 0);
          console.log(result)
      })
  })
  //find by user click date matching with database date
  app.post('/appointmentsByDate',(req, res)=>{
    const date = req.body;
    const email = req.body.email;
        doctorCollection.find({ email: email })
            .toArray((err, doctors) => {
                const filter = { date: date.date }
                if (doctors.length === 0) {
                    filter.email = email;
                }
                appointmentCollection.find(filter)
                    .toArray((err, documents) => {
                        console.log(email, date.date, doctors, documents)
                        res.send(documents);
                    })
            })
    })
    //get all appointments
    app.get('/appointments',(req, res)=>{
        appointmentCollection.find({})
        .toArray((err, documents) =>{
            res.send(documents);
        })
    });
    //add doctor and file upload
    app.post('/addADoctor', (req, res) => {
        const file = req.files.file;
        const name = req.body.name;
        const email = req.body.email;
        const newImg = file.data;
        const encImg = newImg.toString('base64');

        var image = {
            contentType: file.mimetype,
            size: file.size,
            img: Buffer.from(encImg, 'base64')
        };
        console.log(name,email,file);
        // file.mv(`${__dirname}/doctors/${file.name}`, err =>{
        //     if(err){
        //         console.log(err);
        //         return res.status(500).send({msg: 'file image upload error'});
        //     }
        //     return res.send({name: file.name, path: `${file.name}`})
        // })
        doctorCollection.insertOne({ name, email, image })
        .then(result => {
            res.send(result.insertedCount > 0);
        })
    })
    //red all doctor
    app.get('/doctors', (req, res) => {
        doctorCollection.find({})
            .toArray((err, documents) => {
                res.send(documents);
            })
    });
    //sidebar permission only doctor show all tab
    app.post('/isDoctor', (req, res) => {
        const email = req.body.email;
        doctorCollection.find({ email: email })
            .toArray((err, doctors) => {
                res.send(doctors.length > 0);
            })
    })
  console.log('db connected');
});


app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})