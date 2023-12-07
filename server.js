const express = require("express");
const app = express();
const path = require("path");
app.use(express.json());
const fs = require("fs");
const multer = require("multer");

var bodyParser = require("body-parser");
const { response } = require("express");
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

-app.set("views", path.join(__dirname, "views"));
app.set("view engine", "html");
app.engine("html", require("ejs").renderFile);

app.use("/static", express.static("static"));
app.use(express.urlencoded());

// Set storage engine for Multer
const storage = multer.diskStorage({
  destination: "./docs/",
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

// Initialize Multer upload
const upload = multer({
  storage: storage,
  limits: { fileSize: 10000000 }, // File size limit: 10MB
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
}).single("documents");

// Check file type function
function checkFileType(file, cb) {
  // Allowed file extensions
  const filetypes = /pdf|doc|docx/;
  // Check the file extension
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check the MIME type
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb("Error: Only PDF, DOC, and DOCX files are allowed!");
  }
}

app.get("/", (req, res) => {
  const params = {};
  res.status(200).render("LoginPage.html", params);
});

app.get("/vendingLoc", (req, res) => {
  res.status(200).render("VendingLoc.html");
});

const { MongoClient } = require("mongodb");
const uri =
  "mongodb+srv://admin:admin@cluster0.luv9pon.mongodb.net/?retryWrites=true&w=majority"; // Replace placeholders with your MongoDB Atlas connection string
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

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

// Route handler for form submission with file upload
app.post("/submit_application", (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      console.error("Error uploading file:", err);
      res.status(500).send("Error uploading file.");
    } else {
      const {
        location,
        selectedDate,
        selectedTime,
        amount,
        name,
        age,
        aadhar_number,
        contact_number,
        goods_category,
        specific_products,
        hotspot,
        comments,
        agree_to_terms,
      } = req.body;

      try {
        await client.connect();
        const database = client.db("User");
        const collection = database.collection(location);

        // File path in Multer's 'req.file' object
        const filePath = req.file ? req.file.path : "";
        console.log("filepath", filePath)

        if(!filePath)
        {
          return;
        }

        // Insert the form data including selectedDate, selectedTime, and file path into the collection
        const result = await collection.insertOne({
          selectedDate,
          selectedTime,
          amount,
          name,
          age,
          aadhar_number,
          contact_number,
          goods_category,
          specific_products,
          hotspot,
          comments,
          agree_to_terms,
          filePath: filePath, // Save file path in MongoDB
        });

        console.log("Data saved to MongoDB:", result.insertedId);
        res.redirect("/applicationSelected");
      } catch (error) {
        console.error("Error saving data to MongoDB:", error);
        res.status(500).send("Error saving data to MongoDB.");
      } finally {
        // Close the MongoDB connection when you're done
        await client.close();
      }
    }
  });
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
  const location = req.query.location;
  res.render("VendingLicApplication.html", { location });
});

app.get("/applicationSelected", (req, res) => {
  res.render("ApplicantsSelected.html");
});

app.get("/getUsers", async (req, res) => {
  try {
    const selectedLocation = req.query.location;

    // Access the database and the specified collection
    const database = client.db("User"); // Replace with your actual database name
    const selectedCollection = database.collection(selectedLocation);

    // Fetch data from the selected collection
    const users = await selectedCollection.find({}).toArray();

    res.json(users); // Send collection data as JSON
  } catch (err) {
    console.error("Error:", err);
    res.status(500).send("Error fetching data");
  }
});

const port = 8000;

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
