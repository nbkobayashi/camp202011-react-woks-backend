var env = require("./env.json");
var firebase = require("firebase");
require("firebase/firestore");
require("firebase/auth");

global.fetch = require("node-fetch");
var express = require("express");
var app = express();

// Constants
const fireConfig = {
  apiKey: env.FIREBASE_API_KEY,
  authDomain: env.FIREBASE_AUTH_DOMAIN,
  databaseURL: env.FIREBASE_DB_URL,
  projectId: env.FIREBASE_PROJECT_ID,
  storageBucket: env.FIREBASE_STORAGE,
  messagingSenderId: env.FIREBASE_SENDER_ID,
  appId: env.FIREBASE_APP_ID
};

// Methods
const signIn = (email, password) => {
  firebase
    .auth()
    .signInWithEmailAndPassword(email, password)
    .then(user => {
      if (!user) throw new Error("user is empty");
      if (!user.user) throw new Error("user.user is empty");
      if (!user.user.email) throw new Error("user.user.email is empty");

      console.log("sign in.");
    })
    .catch(error => {
      console.log(error);
    });
};

const getMessageDocRef = async () => {
  return await firebase
    .firestore()
    .collection("messages")
    .doc();
};

const sendMessage = async (value, uid) => {
  if (value != "") {
    const docRef = await getMessageDocRef();
    const newMessage = {
      text: value,
      createdAt: firebase.firestore.Timestamp.now(),
      userId: uid
    };
    await docRef.set(newMessage);
  } else {
    console.log("error: sendMessage");
  }
};

// HTTP
app.get("/", function(req, res) {
  fetch(
    "https://firestore.googleapis.com/v1/projects/chatapp-bc471/databases/(default)/documents/messages",
    {
      method: "GET"
    }
  )
    .then(response => response.json())
    .then(json => {
      res.send(json);
    });
});
app.get("/chat", function(req, res) {
  fetch(
    "https://firestore.googleapis.com/v1/projects/chatapp-bc471/databases/(default)/documents/messages",
    {
      method: "GET"
    }
  )
    .then(response => response.json())
    .then(json => {
      json.documents.sort(function(a, b) {
        if (a.createTime > b.createTime) return -1;
        if (a.createTime < b.createTime) return 1;
        return 0;
      });

      let result = "";
      json.documents.forEach(element => {
        result = result + element.fields.text.stringValue + "\r\n";
      });
      res.send(result);
    });
});
app.listen(3000, function() {});

// WebSocket
const server = require("ws").Server;
const ws = new server({ port: 8081 });

if (!firebase.apps.length) {
  firebase.initializeApp(fireConfig);
}

ws.on("connection", socket => {
  console.log("connected!");

  signIn(env.USER_NAME, env.PASSWORD);

  socket.on("message", ms => {
    console.log(ms);
    sendMessage(ms, env.USER_ID);
  });

  socket.on("close", () => {
    console.log("good bye.");
  });
});
