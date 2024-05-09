const { response } = require("express");

class indexController {
  getData(req, res) {
    res.send("HOST IS WORKING");
  }
}

module.exports = indexController;
