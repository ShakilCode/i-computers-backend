import express from 'express'
import { createProduct, deleteProduct, getProductById, getProducts, updateProduct } from '../controllers/productController.js'

const productRouter = express.Router()

productRouter.post("/", createProduct)
productRouter.get("/", getProducts)

// in the endpoit we put a parameter with : means it changes(wenas wena agayak)
// if we delete a product id and every product id is not same so we use this
// here we can give any name instad productId if we want we can give id also any name
productRouter.delete("/:productId", deleteProduct)
// in the update product also we put parameter in the URL like what we need to update
// in the params we put which product need to update, its id.
productRouter.put("/:productId", updateProduct)
// send the id and take the details like that also we need to create our backend
productRouter.get("/:productId", getProductById)


export default productRouter;