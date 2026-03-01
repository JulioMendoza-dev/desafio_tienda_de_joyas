const { Pool } = require("pg");
const format = require("pg-format");

const pool = new Pool({
  user: "julio",
  host: "localhost",
  database: "joyas",
  password: "julio123",
  port: 5432,
});

const testConnection = async () => {
  try {
    const result = await pool.query("SELECT NOW()");
    console.log("BD connected: ", result.rows[0].now);
  } catch (err) {
    console.error("Error connecting to PostgreSQL database:", err);
  }
};

const obtenerJoyas = async ({ limit = 3, order_by = "id_asc", page = 0 }) => {
  try {
    const [campo, direccion] = order_by.split("_"); //separa el campo por el que se ordena y la dirección de ordenamiento (asc o desc) a partir del parámetro order_by
    const offset = page * limit; //calcula el desplazamiento (offset) para la consulta a la base de datos, que se utiliza para paginar los resultados. El offset se calcula multiplicando el número de página (page) por el límite de resultados por página (limit).
    const dir = direccion.toUpperCase() === "DESC" ? "DESC" : "ASC"; // normaliza
    const formattedquery = format(
      "SELECT * FROM inventario ORDER BY %I %s LIMIT %s offset %s",
      campo,
      dir,
      limit,
      offset,
    ); // SELECT * FROM inventario
    // ORDER BY is_ASC LIMIT 3;
    const result = await pool.query(formattedquery); //obtiene el resultado de la consulta a la base
    // de datos ya formateada y lo asigna a la variable inventario
    if (result.rows.length === 0) {
      res
        .status(404)
        .json({
          message: "No se encontraron joyas con los filtros proporcionados.",
        });
    } else
      return {
        //retorna un objeto con la información de la página actual, el límite de resultados por página y las filas del resultado de la consulta a la base de datos
        page,
        limit,
        result: result.rows,
      }; //retorna las filas del resultado de la consulta a la base de datos, que es el inventario solicitado
  } catch (error) {
    throw error;
  }
};

const obtenerJoyasPorFiltros = async ({precio_max,precio_min,categoria,metal,}) => {
  try {
    let filtros = [];//inicializa un array vacío llamado filtros, que se utilizará para almacenar las condiciones de filtrado que se aplicarán a la consulta a la base de datos.
    const values = [];//inicializa un array vacío llamado values, que se utilizará para almacenar los valores de los filtros que se aplicarán a la consulta a la base de datos.

    const agregarFiltro = (campo, comparador, valor) => {//define una función llamada agregarFiltro que toma tres parámetros: campo, comparador y valor. Esta función se utiliza para agregar una condición de filtrado a la consulta a la base de datos.
      values.push(valor);//agrega el valor del filtro al array values, que se utilizará para almacenar los valores de los filtros que se aplicarán a la consulta a la base de datos.
      const { length } = filtros;//obtiene la longitud actual del array filtros y la asigna a la variable length. Esto se utiliza para determinar el número de filtros que se han agregado hasta el momento.
      filtros.push(`${campo} ${comparador} $${length + 1}`);//agrega una nueva condición de filtrado al array filtros, utilizando el campo, el comparador y el número de filtro (length + 1) para construir la condición de filtrado en formato SQL. El número de filtro se utiliza para referenciar el valor correspondiente en el array values.
    };
    if (precio_max) agregarFiltro("precio", "<=", Number(precio_max));//si se proporciona un valor para precio_max, se llama a la función agregarFiltro para agregar una condición de filtrado que compara el campo "precio" con el valor máximo utilizando el operador "<=". El valor máximo se convierte a un número utilizando Number(precio_max) antes de ser agregado al array values.
    if (precio_min) agregarFiltro("precio", ">=", Number(precio_min));//si se proporciona un valor para precio_min, se llama a la función agregarFiltro para agregar una condición de filtrado que compara el campo "precio" con el valor mínimo utilizando el operador ">=". El valor mínimo se convierte a un número utilizando Number(precio_min) antes de ser agregado al array values. 
    if (categoria) agregarFiltro("categoria", "like", categoria);//si se proporciona un valor para categoria, se llama a la función agregarFiltro para agregar una condición de filtrado que compara el campo "categoria" con el valor proporcionado utilizando el operador "like". El valor de categoría se agrega al array values sin necesidad de conversión, ya que se espera que sea una cadena de texto.
    if (metal) agregarFiltro("metal", "like", metal);//si se proporciona un valor para metal, se llama a la función agregarFiltro para agregar una condición de filtrado que compara el campo "metal" con el valor proporcionado utilizando el operador "like". El valor de metal se agrega al array values sin necesidad de conversión, ya que se espera que sea una cadena de texto.

    let consulta = "SELECT * FROM inventario";//inicializa una variable consulta con la consulta SQL básica para seleccionar todos los registros de la tabla "inventario". Esta consulta se irá modificando posteriormente para agregar las condiciones de filtrado según los filtros proporcionados.
    if (filtros.length > 0) {//si se han agregado filtros al array filtros, se procede a construir la cláusula WHERE de la consulta SQL. La cláusula WHERE se construye uniendo las condiciones de filtrado almacenadas en el array filtros utilizando el operador lógico "AND". Esto se hace para asegurar que todas las condiciones de filtrado se apliquen simultáneamente en la consulta a la base de datos.
      filtros = filtros.join(" AND ");//une las condiciones de filtrado almacenadas en el array filtros utilizando el operador lógico "AND" para construir la cláusula WHERE de la consulta SQL. Esto se hace para asegurar que todas las condiciones de filtrado se apliquen simultáneamente en la consulta a la base de datos.
      consulta += ` WHERE ${filtros}`;//agrega la cláusula WHERE a la consulta SQL básica, utilizando las condiciones de filtrado almacenadas en el array filtros. La consulta resultante incluirá solo los registros que cumplan con todas las condiciones de filtrado especificadas.
    }
    const { rows: joyas } = await pool.query(consulta, values);//ejecuta la consulta a la base de datos utilizando el método query del pool de conexiones, pasando la consulta SQL construida y los valores de los filtros como parámetros. El resultado de la consulta se desestructura para obtener las filas resultantes, que se asignan a la variable joyas.
   if (joyas.length === 0) {
      res
        .status(404)
        .json({
          message: "No se encontraron joyas con los filtros proporcionados.",
        });
    } else return {
        campo,
        comparador,
        valor: values[0],
        result: joyas.rows,
      };
  } catch (error) {
    throw error;
  }
};
module.exports = {
  testConnection,
  obtenerJoyas,
  obtenerJoyasPorFiltros,
};
