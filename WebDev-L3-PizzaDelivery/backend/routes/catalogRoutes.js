const express = require("express");

const {
  getPizzas,
  getBuilderOptions,
} = require("../controllers/catalogController");

const router = express.Router();

router.get("/pizzas", getPizzas);
router.get("/builder-options", getBuilderOptions);

module.exports = router;