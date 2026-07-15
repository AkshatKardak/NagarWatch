const { MongoClient } = require("mongodb");

const uri =
  "mongodb+srv://kardakakshat_db_user:Akshat1909@cluster0.n2ryrf6.mongodb.net/nagarwatch?retryWrites=true&w=majority&appName=Cluster0";

async function run() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected!");
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}

run();