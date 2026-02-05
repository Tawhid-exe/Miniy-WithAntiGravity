const express = require("express");
const {
    newOrder,
    getSingleOrder,
    myOrders,
    getAllOrders,
    updateOrder,
    deleteOrder,
    getInvoice
} = require("../controllers/orderController");
const router = express.Router();

const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");

router.route("/order/new").post(isAuthenticatedUser, newOrder);

router.route("/order/:id").get(isAuthenticatedUser, getSingleOrder);
router.route("/order/:id/invoice").get(isAuthenticatedUser, getInvoice);

router.route("/orders/me").get(isAuthenticatedUser, myOrders);

router
    .route("/admin/orders")
    .get(isAuthenticatedUser, authorizeRoles("admin", "owner"), getAllOrders);

router
    .route("/admin/order/:id")
    .put(isAuthenticatedUser, authorizeRoles("admin", "owner"), updateOrder)
    .delete(isAuthenticatedUser, authorizeRoles("admin", "owner"), deleteOrder);

module.exports = router;
