const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const exphbs  = require('express-handlebars');
const logger = require('morgan');
const dotenv = require('dotenv');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const hotelRouter = require('./routes/hotel');
const customerRouter = require('./routes/customer');
const deliveryRouter = require('./routes/delivery');

dotenv.config();

const app = express();

// view engine setup
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'hbs');
// app.engine('handlebars', exphbs({defaultLayout: 'main'}));

// app.engine(".hbs", exphbs({ defaultLayout: "main", extname: ".hbs" }));
// app.set("view engine", ".hbs");


// Handlebars.registerHelper('ifCond', function(v1, v2, options) {
//   if(v1 === v2) {
//     return options.fn(this);
//   }
//   return options.inverse(this);
// });


// var hbs = exphbs.create({
//   helpers: {
//       ifCond: function(v1, v2, options) {
//         if(v1 === v2) {
//           return options.fn(this);
//         }
//         return options.inverse(this);
//       },
//       getStringifiedJson: function (value) {
//           return JSON.stringify(value);
//       }
//   },
//   defaultLayout: 'main',
//   extname: ".hbs",
//   partialsDir: ['views/partials/']
// });

// const exphbs  = require('express-handlebars');

//when configuring the app view engine
app.engine('.hbs', exphbs({
  defaultLayout: "main",
  extname: '.hbs',
  helpers: {
            ifCond: function(v1, v2, options) {
                    if(v1 === v2) {
                      return options.fn(this);
                    }
                    return options.inverse(this);
                  }
          }
}));
app.set('view engine', '.hbs');


// var hbs = exphbs.create({ /* config */ });

// app.engine('handlebars', hbs.engine);
// app.set('view engine', '.hbs');


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'uploads')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/hotel', hotelRouter);
app.use('/customer', customerRouter);
app.use('/delivery', deliveryRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;