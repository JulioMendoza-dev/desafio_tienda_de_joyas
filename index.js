const express = require("express");
const cors = require("cors");
const app = express();
const fs = require("fs");
const {
  testConnection,
  obtenerJoyas,
  obtenerJoyasPorFiltros,
} = require("./consultas");
const path = require("path");

app.use(cors());
app.use(express.json());

const middlewarePersonalizado = (req, res, next) => {
  const start = Date.now();
 res.on("finish", () => {
    const duration = Date.now() - start;
    const register = `${new Date().toISOString()} - ${req.method} ${req.url} - IP: ${req.ip} - Status: ${res.statusCode} - Tiempo: ${duration}ms`;
    fs.appendFileSync("log.txt", register + "\n");
  });

  next();
}
app.use(middlewarePersonalizado);

app.listen(3000, async () => {
  try {
    await testConnection();
    console.log("Server is running on port 3000");
  } catch (error) {
    console.error("Error starting server:", error);
  }
});

app.get("/Joyas", async (req, res) => {
  try {
    // Obtener los parámetros de consulta (query strings)
    const queryStrings = req.query;
    // Imprimir los parámetros de consulta para verificar su contenido
    console.log({ ...req.query });
    // Llamar a la función obtenerJoyas con los parámetros de consulta
    const joyas = await obtenerJoyas(queryStrings);
    // Enviar la respuesta con las joyas obtenidas
    res.json(joyas);
  } catch (error) {
    console.error("Error al obtener las joyas:", error); //respuesta de error al cliente por consola
    res.status(500).json({ error: error.message }); //respuesta de error al cliente por HTTP
  }
});

app.get("/Joyas/filtros", async (req, res) => {
  try {
    const queryStrings = req.query;
    console.log({ ...req.query });
    const inventario = await obtenerJoyasPorFiltros(queryStrings);
    res.json(inventario);
  } catch (error) {
    console.error("Error al obtener el inventario por filtros:", error);
    res.status(500).json({ error: error.message });
  }
});
