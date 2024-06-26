const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.q1nysvk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// middle ware
app.use(cors());
app.use(express.json());

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
async function run() {
  try {
    const userCollection = client.db("newsFeedDB").collection("users");
    const newsCollection = client.db("newsFeedDB").collection("news");

    app.get("/", (req, res) => {
      res.send("News feed is running");
    });

    //  save a single user:
    app.post("/user", async (req, res) => {
      const userInfo = req?.body;
      const username = userInfo?.username;
      const email = userInfo?.email;

      const isUsernameExist = await userCollection.findOne({ username });
      if (isUsernameExist) {
        return res.send({
          message: "Username already exist, Try another username",
        });
      }
      const isUserEmailExist = await userCollection.findOne({ email });
      if (isUserEmailExist) {
        return res.send({
          message: "User Email already exist, Try by another email",
        });
      }
      const result = await userCollection.insertOne(userInfo);
      res.send(result);
    });

    //  get a single user by username and password:
    app.get("/user", async (req, res) => {
      const { username, password } = req?.query;
      const query = { username };

      const user = await userCollection.findOne(query);
      if (!user) {
        return res.send({ message: "Username not found" });
      }
      if (user?.password !== password) {
        return res.send({ message: `Password doesn't match` });
      }
      res.send(user);
    });

    // get the existed username
    app.get("/username-status", async (req, res) => {
      const username = req.query?.username;
      const query = { username };
      const isUsernameExist = await userCollection.findOne(query);
      if (isUsernameExist) {
        return res.send({ message: "username already exist, try another" });
      }
      res.send({ message: "username is valid" });
    });

    // reset a user password by email
    app.patch("/reset-user-password", async (req, res) => {
      const { email, password } = req?.body;
      const query = { email };
      const updateDoc = {
        $set: { password },
      };
      const result = await userCollection.updateOne(query, updateDoc);
      res.send(result);
    });

    // save a single news
    app.post("/add-news", async (req, res) => {
      const post = req?.body;
      const result = await newsCollection.insertOne(post);
      res.send(result);
    });

    // save a single news
    app.get("/news", async (req, res) => {
      const result = await newsCollection.find().toArray();
      res.send(result);
    });

    // delete a particular post based on the id and username:
    app.delete("/delete-post", async (req, res) => {
      const id = req?.query?.id;
      const username = req?.query?.username;
      console.log(id);
      const query = { _id: new ObjectId(id) };
      const post = await newsCollection.findOne(query);
      let result = "";
      if (post.username === username) {
        result = await newsCollection.deleteOne(query);
      }
      res.send(result);
    });

    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`News feed is running on port ${port}`);
});
