
const express = require("express");
const app = express();
const path = require('path');
app.use(express.json());
const fs = require('fs');

var bodyParser = require('body-parser');
const { response } = require("express");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

-
app.set('views',path.join(__dirname, 'views'))
app.set('view engine', 'html');
app.engine('html', require('ejs').renderFile);

app.use('/static',express.static('static'))
app.use(express.urlencoded())


app.get('/',(req,res)=>{
  const params ={ }
  res.status(200).render('LoginPage.html',params)
});

app.get('/vendingLoc',(req,res)=>{
  res.status(200).render('VendingLoc.html')
});


const { MongoClient } = require("mongodb");
const uri = "mongodb+srv://amansingh28002:0852@cluster0.6iqwngg.mongodb.net/?retryWrites=true&w=majority"; // Replace placeholders with your MongoDB Atlas connection string
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("Connected to MongoDB Atlas");
  } catch (error) {
    console.error("Error connecting to MongoDB Atlas:", error);
  }
}

connectToMongoDB();



app.post("/login", async (req, res) => {

  const { category, uname, psw } = req.body;

  try {
    await client.connect();
    const database = client.db("User");
    const collection = database.collection("userDetails");

    // Insert the form data into the collection
    const result = await collection.insertOne({
      category,
      uname,
      psw,
    });

    console.log("Data saved to MongoDB:", result.insertedId);
    res.redirect("/vendingLoc");

  } catch (error) {
    console.error("Error saving data to MongoDB:", error);
    res.status(500).send("Error saving data to MongoDB.");
  } finally {
    // Close the MongoDB connection when you're done
    await client.close();
  }
});


app.post("/submit_application", async (req, res) => {
  
    const { name, age, aadhar_number, contact_number, goods_category, specific_products, hotspot, comments, agree_to_terms } = req.body;
  
    try {
      await client.connect();
      const database = client.db("User");
      const collection = database.collection("application");
  
      // Insert the form data into the collection
      const result = await collection.insertOne({
        name, age, aadhar_number, contact_number, goods_category, specific_products, hotspot, comments, agree_to_terms 
      });
  
      console.log("Data saved to MongoDB:", result.insertedId);
      res.status(200).send("data saved succussfully");
  
    } catch (error) {
      console.error("Error saving data to MongoDB:", error);
      res.status(500).send("Error saving data to MongoDB.");
    } finally {
      // Close the MongoDB connection when you're done
      await client.close();
    }
  });

app.get("/hotspotSel", (req, res) => {
  const location = req.query.location;

  if (location) {
    // Redirect to the next page with the location parameter
    res.render("HotspotSel.html", { location });
  } else {
    res.send("No location parameter provided.");
  }
});

app.get("/vendingApplication", (req, res) => {

  res.status(200).render('VendingLicApplication.html')
});

const port = 8000;

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);

});
