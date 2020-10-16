// importing modules
const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const cors = require('cors');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const ObjectId = require('mongodb').ObjectId
require('dotenv').config()

// Initializing Express Server
const app = express();

// Initializing middlewares
app.use(cors());
app.use(bodyParser.urlencoded({
    extended: true
  }));
app.use(bodyParser.json());
app.use(express.static('images'));
app.use(fileUpload());



// Server Status checker
// app.get('/', (req, res) => {
//     res.send('Server is up and running')
// })


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.0ebkk.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const services = client.db(`${process.env.DB_NAME}`).collection(`${process.env.DB_SERVICES}`);
  const reviews = client.db(`${process.env.DB_NAME}`).collection(`${process.env.DB_REVIEWS}`);
  const orders = client.db(`${process.env.DB_NAME}`).collection(`${process.env.DB_ORDERS}`);
  const admins = client.db(`${process.env.DB_NAME}`).collection(`${process.env.DB_ADMINS}`);

  app.post('/addASerivceImg', (req, res) => {
      const file = req.files.file;
      const name = req.body.name;
      const imgName = file.name;
      const description = req.body.description;
      const serviceInfo = {
        servImg: imgName,
        servName: name,
        servDescription: description
      }
    //   console.log(name, description, file)
      file.mv(`${__dirname}/images/${file.name}`, err => {
          if(err) {
            console.log(err)
            return res.status(500, send({msg: 'failed to uplaod inmage to serber'}))
          } else {
            console.log(serviceInfo);
            services.insertOne(serviceInfo)
            .then( result => {
                console.log(result)
            })
            return res.send({name: file.name, path: `/${file.name}` });
          }
      })
  })

  app.get('/allServices', (req, res) => {
      services.find({})
      .toArray( (err, documents) => {
          res.send(documents)
      })
  })

  app.post( '/addReview', (req, res) => {
    const file = req.files.file;
    const review = {
        reviewer: req.body.reviewer,
        designation: req.body.designation,
        feedback: req.body.feedback,
        reviewerImg: file.name
    }
    file.mv(`${__dirname}/images/${file.name}`, err => {
        if(err) {
            console.log(err);
            return res.status(500, send({msg: 'Failed to upload image to the server'}))
        } else {
            reviews.insertOne(review)
            .then( (results) => {
                console.log(results)
            })
            return res.send({name: file.name, path: `/${file.name}`})
        }
    })
  })

  app.get('/allReviews', (req, res) => {
      reviews.find({})
      .toArray( (err, documents) => {
          res.send(documents)
      })
  })

  // get service info by id
  app.get('/userPanel/orders/:serviceId', (req, res) => {
    //   const id = JSON.parse(req.params.serviceId);
    //   console.log(id)
      console.log(req.params.serviceId)
    // const zId = ObjectId(req.params.serviceId)
    // console.log(zId)
    // console.log(req.query)
      services.find({
          _id: ObjectId(req.params.serviceId)
      })
      .toArray( (err, documents) => {
          res.send(documents[0])
      })
      
  })

  // Post(Place) order
  app.post('/placeOrder', (req, res) => {
    const orderInfo = req.body;
    orders.insertOne(orderInfo)    
    .then( result => {
        res.send(result.insertedCount > 0)
    })
  })

  // Get user specific orders
  app.get('/orders/:email', (req, res) => {
    const loggedInUser = req.params.email;
    orders.find({email: loggedInUser})
    .toArray( (err, documents) => {
        res.send(documents)
    })

  })

  // Update status
  app.patch('/updateStatus/:id', (req, res) => {
    const id = req.params.id;
    console.log(id)
    console.log(req.body.updatedStatus)
    orders.updateOne(
      {_id: ObjectId(id)},
      { $set: {status: req.body.updatedStatus}}
      )
      .then(result => {
        console.log(result)
      })
  })

  // Add User Reviews
  app.post('/addUserReview', (req, res) => {
    const review = req.body;
    console.log(review)
    reviews.insertOne(review)
    .then( result => {
      res.send(result.insertedCount > 0)
    })
  })

  // Add New Service
  app.post('/addService', (req, res) => {
    const file = req.files.file;
    const service = {
      servImg: file.name,
      servName: req.body.servName,
      servDescription: req.body.servDescription
    }
    file.mv(`${__dirname}/images/${file.name}`, err => {
      if(err) {
        return res.status(500, send({msg: 'Failed to upload to server'}))
      } else {
        services.insertOne(service)
        .then(result => {
          console.log(result)
        })
        return res.send({name: file.name, path: `/${file.name}`})
      }
    })
  })
  // Get all orders
  app.get('/allOrders', (req, res) => {
    orders.find({})
    .toArray( (err, documents) => {
      res.send(documents)
    })
  })

  // Add admins 
  app.post('/addAdmin', (req, res) => {
    const adminEmail = req.body;
    admins.insertOne(adminEmail)
    .then( result => {
      console.log(result)
    })
  })

  // check admin
  app.post('/isAdmin', (req, res) => {
    const userEmail = req.body.email;
    console.log(userEmail)
    admins.find({email: userEmail})
    .toArray( (err, documents) => {
      res.send(documents.length > 0)
    })
    
  })
});







// Listening to host for server
app.listen(8080, () => console.log('server running at port 8080'))
