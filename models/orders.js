const { querySelector } = require('../db');
const { verifyToken, checkAdminOrId, checkAdmin } = require('../models/users');
const moment = require('moment');



// ********************GET ORDER ***************************************


const getOrders = async (req, res, next) => {
    try {
        // const orders = await getO();
        const query = 'SELECT * FROM ordenes;';
        const consulta = await querySelector(query, true,);
        console.log(typeof consulta);
        res.status(200).json({ data: consulta });
    } catch (error) {
        res.status(400).json({ error: "Bad request" })
        next(error);
    }
}

/* const getProducts = async (req, res, next) => {
    try {
        const query = 'SELECT * FROM productos;';
        const consulta = await querySelector(query, true,);
        res.status(200).json({ data: consulta });
    } catch (error) {
        next(error);
    }
} */

const getOrderByIdQuery = async (id) => {
    // const query = `
    // SELECT  state, time, payment, nombreProducto FROM ordenes 
    // JOIN productosOrdenes ON ordenes.id = productosOrdenes.idOrdenes 
    // JOIN productos ON productosOrdenes.idProductos = productos.id 
    //     WHERE ordenes.id = :id;
    // `;
    const query = `SELECT * FROM ordenes WHERE id = :id`;
    const result = await querySelector(query, true, { id });
    return result;
}


const getOrderById = async (req, res, next) => {
    // console.log(id)
    console.log('pruebaaa')
    let { id } = req.params;
    try {
        const order = await getOrderByIdQuery(id);
        res.status(200).json({ data: order });
    } catch (error) {
        next(error);
    }
}

const verifyIfOrderExists = async (req, res, next) => {
    const { id } = req.params;

    try {
        const order = await getOrderByIdQuery(id);
        console.log('asdfasdfasdfasdfasdf')
        console.log(order)
        if (!order) {
            res.status(404).json({ error: `Order with id ${id} not found` });
        } else {
            next();
        }

    } catch (error) {
        next(error);
    }
}
/*  */// ********************GET ORDER ***************************************
/* *
*
*
*
***
**/
// ********************CREATE ORDER ***************************************
function listAllProperties(o) {
    var objectToInspect;
    var result = [];
    for (objectToInspect = o; objectToInspect !== null;
        objectToInspect = Object.getPrototypeOf(objectToInspect)) {
        result = result.concat(
            Object.getOwnPropertyNames(objectToInspect)
        );
    }
    return result;
}

// ********************
const descriptionCreator = async (productsiDsArray) => {
    var count = {};
    productsiDsArray.forEach(function (i) { count[i] = (count[i] || 0) + 1; });
    let lenghtObj = Object.keys(count).length;
    let iDsNoRepeated = listAllProperties(count).splice(0, lenghtObj);
    var totalOP2 = 0;
    console.log(totalOP2)
    const query = `SELECT nombreProducto FROM productos WHERE id = :id`;
    const queryQty = `SELECT precio FROM productos WHERE id = :id`;
    let i = 0;
    var orderDescription = "";
    for (const idP of iDsNoRepeated) {
        let productOrderPrice = await querySelector(queryQty, true, { id: idP });
        let productOrderName = await querySelector(query, true, { id: idP });
        orderDescription += count[parseInt(iDsNoRepeated[i])] + 'x' + productOrderName[0].nombreProducto + ' ';
        totalOP2 += count[parseInt(iDsNoRepeated[i])] * productOrderPrice[0].precio;
        i++
    }
    return { orderDescription: orderDescription, iDsNoRepeated: iDsNoRepeated, totalOrderPrice: totalOP2 };
};



const createO = async (iDUser, orderBody) => {
    orderBody.userId = iDUser;
    let descriptionAndTotal = await descriptionCreator(orderBody.products);
    orderBody.description = descriptionAndTotal.orderDescription;
    orderBody.products = descriptionAndTotal.iDsNoRepeated;
    orderBody.total = descriptionAndTotal.totalOrderPrice;
    orderBody.time = moment().format('LT');
    const query = `
        INSERT INTO ordenes (time, description, payment, userId, total,address)
        VALUES (:time, :description, :payment, :userId, :total,:address);
    `;

    const result = await querySelector(query, false, orderBody);

    const orderProductQuery = `
        INSERT INTO productosOrdenes (idOrdenes, idProductos)
        VALUES (:idOrdenes, :idProductos)
    `;
    orderBody.products.forEach(async idProductos => {
        await querySelector(orderProductQuery, false, { idOrdenes: result[0], idProductos });
    });

    return result[0];
}

const createOrder = async (req, res, next) => {
    console.log(req.userData)
    const { id } = req.userData;
    const { payment, products, address } = req.body;
    if (payment && products && address) {
        try {
            const orderId = await createO(id, req.body);
            res.status(201).json({ data: orderId });
        } catch (error) {
            next(error);
        }
    } else {
        res.status(400).json({ message: 'Missing some information!' });
    }
}
// ********************CREATE ORDER ***************************************
/* 
*
*
*
*
*
* */


/**
 ********************UPDATE ORDER***************************************
 */
const updateO = async (id, orderBody) => {

    const { state, products } = orderBody;
    const order = await getOrderByIdQuery(id);
    console.log(products);
    const { orderDescription } = await descriptionCreator(products);
    const query = `
        UPDATE ordenes
        SET description = '${orderDescription || order.description}',
        state = '${state || order.state}'
        WHERE id = :id`;

    await querySelector(query, false, { id });
}

const updateOrder = async (req, res, next) => {
    const orderBody = req.body;
    const { id } = req.params;

    try {
        await updateO(id, orderBody);
        let newState = await getOrderByIdQuery(id);
        res.status(200).json({ data: id, newState: newState.state });
    } catch (error) {
        next(error);
    }
}
/**
 ********************UPDATE ORDER***************************************
 *
 * *
 * 
 * 
 * 
 * 
 * 
 * */

/**
 ********************DELETE ORDER***************************************
 */
const deleteO = async (id) => {
    const query = 'DELETE FROM ordenes WHERE id = :id';
    await querySelector(query, false, { id });
}

const deleteOrder = async (req, res, next) => {
    const { id } = req.params;
    try {
        await deleteO(id);
        res.status(200).json({ delete: `Order number ${id} was succesfully deleted!` })
    } catch (error) {
        next(error);
    }
}

/**
 ********************DELETE ORDER***************************************
**
*
**
*
*
*
**/
/**
 * 
 * ************** GET USER ORDERS**************************
 *  */
const getUserO = async (userId) => {
    const query = 'SELECT * FROM ordenes WHERE userId = :userId';
    const result = await querySelector(query, true, { userId });
    return result[0];
}
const getUserOrders = async (req, res, next) => {
    const { id } = req.params;

    try {
        const orders = await getUserO(id);
        res.status(200).json({ data: orders });
    } catch (error) {
        next(error);
    }
}
/**
 * 
 * ************** GET USER ORDERS**************************
 *  */

/**
 * 
 * 
 * *************GET ORDER PRODUCTS*************
 */
const getOrderP = async (orderId) => {
    const query = `
        SELECT nombreProducto, precio FROM productos
        JOIN productosOrdenes ON productos.id = productosOrdenes.idProductos
        WHERE productosOrdenes.idOrdenes = :orderId;
    `;
    const result = querySelector(query, true, { orderId });
    return result;
}

const getOrderProducts = async (req, res, next) => {
    const { id } = req.params;

    try {
        const products = await getOrderP(id);
        console.log(products)
        res.status(200).json({ data: products });
    } catch (error) {
        next(error);
    }
}

/**
 * 
 * 
 * *************GET ORDER PRODUCTS*************
 * 
 * 
 * 
 * 
 * 
 */

function routesOrders(app) {
    app.use('/ordenes', verifyToken);

    app.get('/ordenes', checkAdmin, getOrders);

    app.post('/ordenes', createOrder);

    app.get('/ordenes/:id', checkAdminOrId, verifyIfOrderExists, getOrderById);

    app.put('/ordenes/:id', checkAdminOrId, verifyIfOrderExists, updateOrder);

    app.delete('/ordenes/:id', checkAdmin, verifyIfOrderExists, deleteOrder);

    app.get('/ordenes/usuarios/:id', checkAdmin, getUserOrders);

    app.get('/ordenes/:id/productos', checkAdminOrId, verifyIfOrderExists, getOrderProducts);
}
module.exports = {
    routesOrders
}