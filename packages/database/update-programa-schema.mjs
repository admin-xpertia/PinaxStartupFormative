import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import Surreal from "surrealdb";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Surreal();

async function main() {
  try {
    console.log("Conectando a SurrealDB...");
    await db.connect("http://localhost:8000/rpc");

    console.log("Autenticando...");
    await db.signin({
      username: "root",
      password: "root",
    });

    console.log("Seleccionando namespace y database...");
    await db.use({ namespace: "xpertia", database: "plataforma" });

    console.log("Leyendo archivo de schema...");
    const schemaPath = join(__dirname, "update-programa-schema.surql");
    const schema = readFileSync(schemaPath, "utf-8");

    console.log("Ejecutando actualización de schema...");
    const result = await db.query(schema);
    console.log("Resultado:", JSON.stringify(result, null, 2));

    console.log("✅ Schema actualizado exitosamente");

    await db.close();
  } catch (error) {
    console.error("❌ Error actualizando schema:", error);
    process.exit(1);
  }
}

main();
