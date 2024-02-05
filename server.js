const express = require('express');
const path = require('path');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const app = express();
let session = require('express-session');
const multer = require('multer');

app.set('view engine', 'ejs')

const connection = mysql.createConnection({
  host     : 'localhost', // Your connection adress (localhost).
  user     : 'root',     // Your database's username.
  password : 'root',        // Your database's password.
  database : 'kinconnect'   // Your database's name.
});

// // Starting our app.
connection.connect((error, results) => {
  // If some error occurs, we throw an error.
  if (error) throw error;

})

// Starting our server.

app.use('/assets', express.static('./assets'))
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json({limit: '35mb'}))
app.use(session({
  secret: 'kinconnect website',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, expires: 3600000 }
}))

const upload = multer({ storage: multer.memoryStorage() })


app.get('/', (req, res) => {
  // res.send("vous êtes bien connecté dans votre site!");
  if (req.session.user) {
    res.locals.user = JSON.parse(req.session.user)
    // res.locals.image = req.session.image
  }
  connection.query('SELECT * FROM categorie', function (error, result, fields) {
    if (error) throw error
    connection.query('SELECT idart, design, categorie, description, image, prix, adresse, idcat, nomcat FROM article left join categorie on categorie.idcat = article.categorie order by rand() limit 9', function (error, results, fields) {
      if (error) throw error
      res.locals.categories = result
      res.locals.annonce = results
      res.render(path.join(__dirname + '/views/index.ejs'), { page: 'index'})
    })
  })

})

app.get('/kin-market', (req, res) => {
  // res.send("vous êtes bien connecté dans votre site!");
  if (req.session.user) {
    res.locals.user = JSON.parse(req.session.user)
  }
  if (req.session.success) {
    res.locals.success = req.session.success
    req.session.success = undefined
  }

  connection.query('SELECT * FROM categorie', function (error, result, fields) {
    if (error) throw error
    connection.query('SELECT idart, design, categorie, description, image, prix, adresse, idcat, nomcat FROM article left join categorie on categorie.idcat = article.categorie order by rand()', function (error, results, fields) {
      if (error) throw error
      res.locals.categories = result
      res.locals.annonce = results
      res.render(__dirname + '/views/portfolio.ejs', { page: 'portfolio' })
    })
  })
})

app.get('/team', (req, res) => {
  // res.send("vous êtes bien connecté dans votre site!");
  if (req.session.user) {
    res.locals.user = JSON.parse(req.session.user)
  }
  res.render(__dirname + '/views/team.ejs', { page: 'team' })
})

app.get('/apropos', (req, res) => {
  // res.send("vous êtes bien connecté dans votre site!");
  if (req.session.user) {
    res.locals.user = JSON.parse(req.session.user)
  }
  res.render(__dirname + '/views/about.ejs', { page: 'about' })
})

app.get('/contact', (req, res) => {
  // res.send("vous êtes bien connecté dans votre site!");
  if (req.session.user) {
    res.locals.user = JSON.parse(req.session.user)
  }
  res.render(__dirname + '/views/contact.ejs', { page: 'contact' })
})

app.get('/login', (req, res) => {
  // res.send("vous êtes bien connecté dans votre site!");
  if(req.session.error){
    res.locals.error = req.session.error
    req.session.error = undefined
  }
  res.render(path.join(__dirname + '/views/authPages/login.ejs'), { page: 'login'})
  
})

app.get('/inscription', (req, res) => {
  // res.send("vous êtes bien connecté dans votre site!");
  if(req.session.errors){
    res.locals.errors = req.session.errors
    req.session.errors = undefined
  }
  res.render(__dirname + '/views/authPages/signup.ejs', { page: 'signup' })
})

app.get('/user/workspace', (req, res) => {
  // res.send("vous êtes bien connecté dans votre site!");
  if (req.session.user) {
    res.locals.user = JSON.parse(req.session.user)
  }
  connection.query('SELECT * FROM categorie', function (error, result, fields) {
    if (error) throw error
    connection.query('SELECT idart, design, categorie, description, image, prix, adresse, idcat, nomcat FROM article left join categorie on categorie.idcat = article.categorie order by rand() limit 9', function (error, results, fields) {
      if (error) throw error
      res.locals.categories = result
      res.locals.annonce = results
      res.render(__dirname + '/views/workspace.ejs', { page: '' })
    })
  })
})

app.post('/login', (req, res) => {
  
  connection.query('SELECT * FROM utilisateur where email ="' + req.body.mail + '" or phone ="' + req.body.mail + '" ', function (error, results, fields) {
    // If some error occurs, we throw an error.
    if (error) throw error;

    else if( results.length != 0 && req.body.pass == results[0].password ) {
      req.session.user = JSON.stringify(results[0])
      res.redirect('/')
    }
    else if( results.length != 0 && req.body.pass != results[0].password ) {
      req.session.error = 'Mauvais mot de passe!'
      res.redirect('/login')
    }
    else {
      req.session.error = 'Informations incorrectes!'
      res.redirect('/login')
    }
  
  });

})

app.post('/inscription', (req, res) => {
  console.log(req.body);

  if (req.body.password == req.body.confpass && req.body.phone != "" && req.body.firstname != ""  && req.body.lastname != ""  ) {

    connection.query('INSERT INTO utilisateur(prenom, nom, email, phone, password) values("'+ req.body.firstname +'", "'+ req.body.lastname +'", "'+ req.body.email +'", "'+ req.body.phone +'",  "'+ req.body.password +'")', function (error) {
  
      if (error) throw error;

      connection.query('SELECT * FROM utilisateur where email ="' + req.body.email + '" or phone ="' + req.body.email + '" ', function (error, results, fields) {
        if (error) throw error;
        req.session.user = JSON.stringify(results[0])
        res.redirect('/')
        console.log("ligne enregistrée !");
      });
    });

  } else {
    req.session.errors = 'Le mot de passe ne correspond pas!'
    res.redirect('/inscription')
  }

})

app.post('/kin-market/add-data', upload.array('image1', 5), (req, res) => {
  
  let arrayImage = []
  req.files.forEach(file => {
    arrayImage.push({data: file.buffer.toString('base64')})
  })

  let imagejson = JSON.stringify(arrayImage)

  if (req.body.categorie != "" ) {

    connection.query('INSERT INTO article(design, categorie, description, image, prix, adresse) values(?,?,?,?,?,?)', 
    [req.body.titre, req.body.categorie, req.body.description, imagejson, req.body.prix, req.body.commune +', '+ req.body.adresse], function (error) {
  
      if (error) throw error;
      req.session.success = 'Vous avez publier une nouvelle annonce !'
      res.redirect('/kin-market')

    });

  } else {
    req.session.errors = 'Le mot de passe ne correspond pas!'
    res.redirect('/inscription')
  }

})

app.get('/kin-market/article-detail', (req, res) => {
  // res.send("vous êtes bien connecté dans votre site!");
  if (req.session.user) {
    res.locals.user = JSON.parse(req.session.user)
  }
  // if (req.session.success) {
  //   res.locals.success = req.session.success
  //   req.session.success = undefined
  // }

  connection.query('SELECT * FROM article where idart = 1', function (error, results, fields) {
    if (error) throw error
    res.locals.annonce = results
    res.render(__dirname + '/views/portfolio-details.ejs', { page: 'portfolio' })
  })
})

app.get('/logout', (req, res) => {
  
  req.session.destroy(function (error) {
    // If some error occurs, we throw an error.
    if (error) throw error;
    else {
      res.redirect('/')
    }
  
  });

})

app.post('/user/workspace/update-profile', upload.single('photofile'), (req, res) => {

  if(req.file){
    let image = req.file.buffer.toString('base64')
    connection.query('UPDATE utilisateur SET prenom = ?, nom = ?, email = ?, phone = ?, image = ? WHERE id = ?',[req.body.firstname, req.body.lastname, req.body.email, req.body.phone, image, req.body.iduser], (err, rows, fields) => {
      if (err) throw err
      connection.query('SELECT * FROM utilisateur where email ="' + req.body.email + '" or phone ="' + req.body.email + '" ', function (error, results, fields) {
        if (error) throw error;
        req.session.user = JSON.stringify(results[0])
        res.redirect('/user/workspace')
        console.log("ligne enregistrée !");
      });
    })
  }
  else {
    connection.query('SELECT * FROM utilisateur where email ="' + req.body.email + '" or phone ="' + req.body.email + '" ', function (error, results, fields) {
      if (error) throw error
      image = results[0].image
      connection.query('UPDATE utilisateur SET prenom = ?, nom = ?, email = ?, phone = ?, image = ? WHERE id = ?',[req.body.firstname, req.body.lastname, req.body.email, req.body.phone, image, req.body.iduser], (err, rows, fields) => {
        if (err) throw err
        connection.query('SELECT * FROM utilisateur where email ="' + req.body.email + '" or phone ="' + req.body.email + '" ', function (error, results, fields) {
          if (error) throw error;
          req.session.user = JSON.stringify(results[0])
          res.redirect('/user/workspace')
          console.log("ligne enregistrée !");
        });
      })
    })
  }

})

app.listen(3000, () => {
 console.log('Go to http://127.0.0.1:3000/ so you can see the data.');
});