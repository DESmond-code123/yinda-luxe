const express = require("express");
const serverless = require("serverless-http");
const { createClient } = require("@supabase/supabase-js");

const app = express();
app.use(express.json({ limit: "2mb" }));

function db() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase environment variables are not configured.");
  }
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

app.get(["/health", "/api/health"], (req, res) => {
  res.json({
    ok: true,
    service: "Yinda's Luxe API",
    supabaseConfigured: Boolean(
      process.env.SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
  });
});

app.get(["/products", "/api/products"], async (req, res) => {
  try {
    const { data, error } = await db()
      .from("products")
      .select("*")
      .order("id");

    if (error) throw error;
    res.json({ products: data || [] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post(["/orders", "/api/orders"], async (req, res) => {
  try {
    const {
      customer_name,
      phone,
      email,
      address,
      items,
      total,
      payment_method
    } = req.body || {};

    if (!customer_name || !phone || !Array.isArray(items) || !items.length) {
      return res.status(400).json({
        error: "Customer details and items are required."
      });
    }

    const { data, error } = await db()
      .from("orders")
      .insert([{
        customer_name,
        phone,
        email: email || null,
        address: address || null,
        items,
        total: Number(total || 0),
        payment_method: payment_method || "whatsapp",
        payment_status: "pending",
        status: "Pending"
      }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ order: data });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports.handler = serverless(app);
