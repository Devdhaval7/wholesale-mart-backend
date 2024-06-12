var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var cors = require("cors");
const ApiError = require("./core/ApiError");

const IndexRoute = require("./routes/index");
const AuthRoute = require("./routes/auth/authRoute");
const UsersRoute = require("./routes/users/usersRoute");
const ProductRoute = require("./routes/product/productRoute");
const TaskRoute = require("./routes/task/taskRoute");
const CRMRoutes = require("./routes/CRM/crmRoute");
const ShoppingRoute = require("./routes/shopping/shoppingRoute");
const OrderRoute = require("./routes/Orders/orderRoute");

const swaggerRoute = require("./routes/swagger/swaggerRoute");

class App {
  /**
   * Constructor.
   *
   * @class Server
   * @constructor
   */
  constructor() {
    this.router = express.Router();

    //create express js application
    this.app = express();
    console.log(`Worker ${process.pid} started`);

    //configure application
    this.config();

    //add routes For Web APP
    this.web();

    //add api For Rest API
    this.api();

    // Error handling
    this.ErrorHandling();

    this.swagger();

    //use router middleware
    // this.app.use(this.router);
  }
  /**
   * Bootstrap the application.
   *Server
   * @static
   * @return {ng.auto.IInjectorService} Returns the newly created injector for this app.
   */
  static bootstrap() {
    return new App();
  }

  /**
   * Create REST API routes
   *
   * @class Server
   * @method api
   */
  api() {
    new IndexRoute(this.router);
    new AuthRoute(this.router);
    new UsersRoute(this.router);
    new ProductRoute(this.router);
    new TaskRoute(this.router);
    new CRMRoutes(this.router);
    new ShoppingRoute(this.router);
    new OrderRoute(this.router);

    //use router middleware
    this.app.use("/api", this.router);
  }

  swagger() {
    new swaggerRoute.SwaggerRoute(this.router);
    //use router middleware
    this.app.use("/", this.router);
  }

  /**
   * Configure application
   *
   * @class Server
   * @method config
   */
  config() {
    this.app.use("/public", express.static("public"));

    //add static paths
    this.app.use(express.static(path.join(__dirname, "public")));

    //configure pug
    this.app.set("views", express.static(path.join(__dirname, "views")));
    this.app.set("view engine", "ejs");

    //mount json form parser
    // this.app.use(bodyParser.json({ limit: '50mb' }));

    // this.app.use(compression());

    //mount query string parser
    // this.app.use(bodyParser.urlencoded({
    //     extended: true
    // }));

    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: false }));

    this.app.use(async function (req, res, next) {
      res.header("Access-Control-Allow-Origin", "*");
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Access-Control-Allow-Headers, crossdomain, withcredentials, Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Origin, TokenType"
      );
      res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, OPTIONS, PUT, PATCH, DELETE"
      );
      next();
    });
    this.app.use(
      cors({ origin: process.env.CORS_URL, optionsSuccessStatus: 200 })
    );
    //mount cookie parser middleware
    this.app.use(cookieParser("SECRET_GOES_HERE"));
    this.app.use(express.static(path.join(__dirname, "public")));
  }

  ErrorHandling() {
    //error handling
    this.app.use((req, res, next) => next(new ApiError.NotFoundError()));
    // catch 404 and forward to error handler
    this.app.use((err, req, res, next) => {
      if (err instanceof ApiError.ApiError) {
        ApiError.ApiError.handle(err, res);
      } else {
        if (process.env.NODE_ENV === "development") {
          // Logger_1.default.error(err);
          return res.status(500).send(err.message);
        }
        ApiError.ApiError.handle(new ApiError.InternalError(), res);
      }
    });
  }

  /**
   * Create and return Router.
   *
   * @class Server
   * @method web
   * @return void
   */
  web() {
    //IndexRoute
    this.app.use("/", this.router);
  }
}

exports.App = App;
