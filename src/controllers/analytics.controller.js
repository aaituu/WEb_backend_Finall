const Order = require("../models/Order");

async function topProducts(req, res, next) {
  try {
    const limit = Math.min(Number(req.query.limit || 10), 50);

    const pipeline = [
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          name: { $first: { $ifNull: ["$items.titleSnapshot", "$items.name"] } },
          soldQty: { $sum: "$items.qty" },
          revenue: { $sum: { $multiply: ["$items.qty", "$items.unitPrice"] } }
        }
      },
      { $sort: { soldQty: -1 } },
      { $limit: limit }
    ];

    const results = await Order.aggregate(pipeline);
    res.json({ results });
  } catch (err) {
    next(err);
  }
}

async function salesByStatus(req, res, next) {
  try {
    const pipeline = [
      {
        $group: {
          _id: "$status",
          orders: { $sum: 1 },
          revenue: { $sum: "$total" }
        }
      },
      { $sort: { orders: -1 } }
    ];

    const results = await Order.aggregate(pipeline);
    res.json({ results });
  } catch (err) {
    next(err);
  }
}

module.exports = { topProducts, salesByStatus };
