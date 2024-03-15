const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  ScanCommand,
} = require("@aws-sdk/lib-dynamodb");
const express = require("express");
const serverless = require("serverless-http");


const app = express();

const LANGUAGES_TABLE = process.env.LANGUAGES_TABLE;
console.log("LANGUAGES_TABLE", LANGUAGES_TABLE);
const client = new DynamoDBClient();
const dynamoDbClient = DynamoDBDocumentClient.from(client);


app.use(express.json());

app.get("/", function (req, res) {
  res.json({hello: "KalaungTech"});
  return;
  // seed data
  const data = {
      "go": {
          "usecase": "system, web, server-side",
          "rank": 16,
          "compiled": true,
          "homepage": "https://golang.org",
          "download": "https://golang.org/dl/",
          "votes": 4
      },
      "java": {
          "usecase": "system, web, server-side",
          "rank": 2,
          "compiled": true,
          "homepage": "https://www.java.com/en/",
          "download": "https://www.java.com/en/download/",
          "votes": 1
      },
      "javascript": {
          "usecase": "web, frontend development",
          "rank": 1,
          "compiled": false,
          "homepage": "https://en.wikipedia.org/wiki/JavaScript",
          "votes": 0
      },
      "nodejs": {
          "usecase": "system, web, server-side",
          "rank": 30,
          "compiled": false,
          "homepage": "https://nodejs.org/en/",
          "download": "https://nodejs.org/en/download/",
          "votes": 3
      }
    };
  Object.keys(data).forEach(async (name) => {
    const params = {
      TableName: LANGUAGES_TABLE,
      Item: {
        Name: name,
        ...data[name],
      },
    };
    await dynamoDbClient.send(new PutCommand(params));
  });
  res.json({ message: "Data seeded", data: data });

});


app.get("/languages/:name", async function (req, res) {
  const params = {
    TableName: LANGUAGES_TABLE,
    Key: {
      Name: req.params.name,
    },
  };

  try {
    const { Item } = await dynamoDbClient.send(new GetCommand(params));
    if (Item) {
      const { Name, usecase, rank, compiled, homepage, download, votes } = Item;
      res.json({ 
        name: Name, 
        codedetail: {
          usecase: usecase,
          rank: rank,
          compiled: compiled,
          homepage: homepage,
          download: download,
          votes: votes
        }
      });
    } else {
      res
        .status(404)
        .json({ error: 'Could not find the language with the name "${req.params.name}"' });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Could not retreive language details" });
  }
});

app.get("/languages", async function (req, res) {
  const params = {
    TableName: LANGUAGES_TABLE,
  };

  try {
    const { Items } = await dynamoDbClient.send(new ScanCommand(params));
    // const { Items } = await dynamoDbClient.send(new ScanCommand(params));
    
    
    res.json(Items);
    
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Could not retreive languages" });
  }
});

app.get("/languages/:name/vote", async function (req, res) {
  const LanguageName = req.params.name;
  const params = {
    TableName: LANGUAGES_TABLE,
    Key: {
      Name: LanguageName,
    },
  };

  try {
    const { Item } = await dynamoDbClient.send(new GetCommand(params));
    if (Item) {
      const { Name, usecase, rank, compiled, homepage, download, votes } = Item;
      const updateVotes = votes + 1;
      const updateParams = {
        TableName: LANGUAGES_TABLE,
        Key: {
          Name: LanguageName,
        },
        UpdateExpression: "set votes = :v",
        ExpressionAttributeValues: {
          ":v": updateVotes,
        },
      };
      await dynamoDbClient.send(new UpdateCommand(updateParams));

      res.json({ 
        name: Name, 
        codedetail: {
          usecase: usecase,
          rank: rank,
          compiled: compiled,
          homepage: homepage,
          download: download,
          votes: updateVotes
        }
      });
    } else {
      res
        .status(404)
        .json({ error: 'Could not find the language with the name "${req.params.name}"' });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Could not retreive user" });
  }

});


app.use((req, res, next) => {
  return res.status(404).json({
    error: "Not Found",
  });
});


module.exports.handler = serverless(app);
