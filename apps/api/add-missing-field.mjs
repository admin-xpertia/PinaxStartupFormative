import Surreal from "surrealdb.js";
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function addMissingFields() {
  const db = new Surreal();

  try {
    console.log("Conectando a SurrealDB...");
    await db.connect("wss://ethereal-orchid-06d50itdk1th7camgn0go599ao.aws-usw2.surreal.cloud");

    console.log("Autenticando...");
    await db.signin({
      username: "admin",
      password: "xpertia123",
    });

    console.log("Seleccionando namespace y database...");
    await db.use({ namespace: "StartupFormative", database: "Roadmap" });

    console.log("Cargando script...");
    const scriptPath = path.join(__dirname, 'add-missing-field.surql');
    const script = await fs.readFile(scriptPath, 'utf8');

    console.log("Ejecutando...");
    const result = await db.query(script);

    console.log("✓ Campos agregados correctamente");
    console.log(`Respuestas recibidas: ${result.length}`);

    await db.close();
  } catch (error) {
    console.error("Error:", error);
    console.error("Stack:", error.stack);
    process.exit(1);
  }
}

addMissingFields();
