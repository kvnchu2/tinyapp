const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieParser = require('cookie-parser');
app.use(cookieParser());

app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "aJ48lW" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "aJ48lW" }
};

const users = { 
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
}

//used to add object to userID in users
function createObj(ke, val) {
  const newObj = {};
  newObj[ke] = val;
  return newObj;
}
//generates random 6 character alphanumeric
function generateRandomString() {
  var text = "";

  var charset = "abcdefghijklmnopqrstuvwxyz0123456789";

  for( var i=0; i < 6; i++ )
      text += charset.charAt(Math.floor(Math.random() * charset.length));

  return text;
}

//used for login validation
function validate(key, item) {
  const usersArr = Object.keys(users);
  for (let user of usersArr) {
    if (users[user][key] === item){
      return true;
    } 
  }
  return false;
}

//used for obtaining ID
function obtainID(email) {
  const userKeys = Object.keys(users);
  for (let user of userKeys) {
    if (users[user]['email'] === email){
      return user;
    } 
  }
}

//used for getting the urls for user id
function urlsForUser(id) {
  let userObj = {};
  for (let user in urlDatabase) {
    if (urlDatabase[user]['userID'] === id) {
      userObj[user] = urlDatabase[user]['longURL'];
    }
  }
  return userObj;
}

//used for validating if user is owner of shortURL
function isOwner(shortURL, userID){
  if (urlDatabase[shortURL]['userID'] === userID) {
    return true;
  }
  return false;
}




app.get("/", (req, res) => {
  res.send("Hello!");
});

//deletes URL

//renders urls_new page
app.get("/urls/new", (req, res) => {
  const user_id = req.cookies['user_id'];
  if (typeof user_id === 'undefined') {
    res.redirect('/login');
  } else {
  const templateVars = {user: users[user_id]}
  res.render("urls_new", templateVars);
  }
});

//redirects user to longURL via hyperlink
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL]['longURL'];
  res.redirect(longURL);
});

//renders urls_show page displaying short and long urls
app.get("/urls/:shortURL", (req, res) => {
  const user_id = req.cookies['user_id'];
  const isOwnerVar = isOwner(req.params.shortURL, user_id);
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL]['longURL'], user: users[user_id], owner: isOwnerVar};
  res.render("urls_show", templateVars);
});

//displays urlDatabase
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

//renders urls_index page with long and short urls
app.get("/urls", (req, res) => {
  const user_id = req.cookies['user_id'];
  const newUrlDatabase = urlsForUser(user_id);
  const templateVars = { urls: newUrlDatabase, user: users[user_id]};
  console.log(newUrlDatabase);
  res.render("urls_index", templateVars);
});

//sends back html for hello
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/register", (req, res) => {
  const templateVars = { urls: urlDatabase};
  res.render("urls_register", templateVars);
})

app.get("/login", (req, res) => {
  res.render("login");
})


app.post("/register", (req, res) => {
  if (req.body.email === '' || req.body.password === '') {
    return res.status(400).send('input fields are blank');
  } else if (validate('email', req.body.email)) {
    return res.status(400).send('email already exists!');
  } else {
  const userID = generateRandomString();
  users[userID] = createObj('id', userID);
  users[userID]['email'] = req.body.email;
  users[userID]['password'] = req.body.password;
  res.cookie('user_id', userID);
  res.redirect('/urls');
  }
})



app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
})


app.post("/login", (req, res) => {
  if (!validate('email', req.body.email)) {
    console.log(users);
    return res.status(403).send('forbidden');
  } else if (validate('email', req.body.email) === true && !validate('password', req.body.password)) {
    return res.status(403).send('password does not match');
  } else if (validate('email', req.body.email) === true && validate('password', req.body.password) === true) {
    const userID = obtainID(req.body.email);
    res.cookie('user_id',userID);
    res.redirect('/urls');
  }
})

app.post("/urls/:shortURL/delete", (req, res) => {
  const user_id = req.cookies['user_id'];
  const newUrlDatabase = urlsForUser(user_id);
  if (urlDatabase[req.params.shortURL]['userID'] === user_id) {
  delete urlDatabase[req.params.shortURL];
  console.log(urlDatabase);
  res.redirect(`/urls`);
  } else {
    return res.status(511).send('You do not have permission to delete');
  }
})


//after user inputs url into edit field, they are redirected to urls_show
app.post("/urls/:id", (req, res) => {
  const user_id = req.cookies['user_id'];
  const newUrlDatabase = urlsForUser(user_id);
  if (urlDatabase[req.params.id]['userID'] === user_id) {
  const longURL = req.body.longURL;
  const shortURL = req.params.id;
  urlDatabase[shortURL].longURL = longURL;
  console.log(urlDatabase)
  res.redirect("/urls")
  } else {
    return res.status(511).send('You do not have permission to edit');
  }
})

//after user inputs url, they are redirected to urls_index
app.post("/urls", (req, res) => {
  const user_id = req.cookies['user_id']
  const shortURL = generateRandomString();
  urlDatabase[shortURL]= createObj('longURL',req.body.longURL); 
  urlDatabase[shortURL]['userID'] = user_id;
  console.log(urlDatabase);
   // Log the POST request body to the console
  res.redirect(`/urls/${shortURL}`);        
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});