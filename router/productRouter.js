import express from 'express'
import { createProduct, deleteProduct, getProductById, getProducts, searchProducts, updateProduct } from '../controllers/productController.js'

const productRouter = express.Router()

// Create a new product
// Method: POST
// URL: /products
productRouter.post("/", createProduct)
// Get all products
// Method: GET
// URL: /products
productRouter.get("/", getProducts)
productRouter.get("/search/:query", searchProducts);

// Delete a product by ID
// Method: DELETE
// URL example: /products/12345
// in the endpoit we put a parameter with : means it changes(wenas wena agayak)
// if we delete a product id and every product id is not same so we use this
// here we can give any name instad productId if we want we can give id also any name
productRouter.delete("/:productId", deleteProduct)
// Update a product by ID
// Method: PUT
// URL example: /products/12345
// in the update product also we put parameter in the URL like what we need to update
// in the params we put which product need to update, its id.
productRouter.put("/:productId", updateProduct)
// Get a single product by ID
// Method: GET
// URL example: /products/12345
// send the id and take the details like that also we need to create our backend
// all details for that specific product.
productRouter.get("/:productId", getProductById)

// Export router
export default productRouter;