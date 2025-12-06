import { isAdmin } from "./userController.js";
import Product from "../models/product.js";

// Create product function
export async function createProduct(req, res){

    // if the request is not an admin
    if(! isAdmin (req)){
        res.status(403).json({message : "Access denied. Admins only."})
        return;
    }

    try{

        // check is there any existing product from a id
        // find one product
        const existingProduct = await Product.findOne({
            // is there any productId by from the same as this request's productId
            productId : req.body.productId
        })

        // if htere is a product then
        if(existingProduct){
            res.status(400).json({message : "Product with given productId already exists"})
            // stop running if yes
            return;
        }


        // empty json 
        const data = {}

        // make equal to data's product id to request product id
        data.productId = req.body.productId

        // check name is already exist or not
        if(req.body.name == null){
            res.status(400).json({message : "Product name is required"})
            return
        }
        data.name = req.body.name
        // if there is no decription in the request body then we will put a empty string
        data.description = req.body.description || ""
        // if no alternative names then empty array
        data.altNames = req.body.altNames || []

        // price is required so put if and check
        if(req.body.price == null){
            res.status(400).json({message : "Product price is required"})
            return
        }
        data.price = req.body.price
        // if there is no any labelled price then put the request price
        data.labelledPrice = req.body.labelledPrice || req.body.price
        data.category = req.body.category || "Others"
        data.images = req.body.images || ["/images/default-product-1.png", "/images/default-product-2.png"]
        data.isVisible = req.body.isVisible
        data.brand = req.body.brand || "Generic"
        data.model = req.body.model || "Standard"

        // create new product by using data json
        const newProduct = new Product(data)
        // save the product
        await newProduct.save()
        // if success displays this message
        res.status(201).json({message : "Product created successfully", product: newProduct})

    }catch(error){
        res.status(500).json({message : "Error creating product", error:error})
    }
}


// view product function
// if admin then need to displya all products
// if customer then should display only visible products
export async function getProducts(req, res){

    try{

        // check the user admin or not
        if(isAdmin(req)){

            // find the products
            const products = await Product.find();

            // send the products to the front end
            res.status(200).json(products)

        }else{
            // if not a admin then shows only visible true products
            const products = await Product.find({isVisible: true})
            res.status(200).json(products);
        }

    }catch(error){
        res.status(500).json({ message : "Error fetching products", error:error})
    }
}


// delete product function
export async function deleteProduct(req, res){

        if(! isAdmin (req)){
        res.status(403).json({message : "Access denied. Admins only."})
        return;
    }

    try{
        // equal the constant productId to the request parameter product ID
        // we sent product id in params because in the router we put a parameter in the endt point with colon
        // we never put in the body we put the id in the url of the postman so we put params
        // put here name as porductId (req.params.productId) because in the delete parameter name is that if it name id then here we need to put id
        const productId = req.params.productId

        // delete one product
        await Product.deleteOne({ productId: productId})

        res.status(200).json({message : "Product deleted successfully"})
    } catch (error){

        res.status(500).json({ message : "Error deleting product", error: error})
    }
}


// update product
export async function updateProduct(req, res){
    // if the request is not an admin
    if(! isAdmin (req)){
        res.status(403).json({message : "Access denied. Admins only."})
        return;
    }

    try{

        // product id of the updating product
        const productId = req.params.productId

        // empty json to store data temporarily
        const data = {}

        // check name is already exist or not
        if(req.body.name == null){
            res.status(400).json({message : "Product name is required"})
            return
        }
        // if there is a name in the request's body put that name to the data's name like that we put all description, altNames, etc.
        data.name = req.body.name
        // if there is no decription in the request body then we will put a empty string
        data.description = req.body.description || ""
        // if no alternative names then empty array
        data.altNames = req.body.altNames || []

        // price is required so put if and check
        if(req.body.price == null){
            res.status(400).json({message : "Product price is required"})
            return
        }
        data.price = req.body.price
        // if there is no any labeled price then put the request's body price
        data.labelledPrice = req.body.labelledPrice || req.body.price
        data.category = req.body.category || "Others"
        data.images = req.body.images || ["/images/default-product-1.png", "/images/default-product-2.png"]
        data.isVisible = req.body.isVisible
        data.brand = req.body.brand || "Generic"
        data.model = req.body.model || "Standard"

        // update the product
        /* in here updateOne function we need to put a json like name: req.body.name
        it is hard to create like that so we created an empty json now it has datas so instead a json
        we just put the empty json variable name here so here we do not need to type like that json again */ 
        await Product.updateOne({ productId: productId}, data)
        
        // if success displays this message
        res.status(201).json({message : "Product updated successfully"})

    }catch(error){
        res.status(500).json({message : "Error updating product", error:error})
    }
}

// send the id and take the details like that also we need to create our backend
// view only one product by giving get req
export async function getProductById(req , res){
    try{

        // find the product
        const productId = req.params.productId;
        const product = await Product.findOne({productId: productId});

        // check if there is no any product
        if(product == null){
            res.status(404).json({message : "Product not found"});
            return;
        }

        // check the product is visible or not, check the admin or customer, if admin display the porduct else it displays error 404
        if(!product.isVisible){
            if(!isAdmin(req)){
                res.status(404).json({message : "Product not found."});
                return;
            }
        }
        res.status(200).json(product);

    }catch(error){
        res.status(500).json({message : "Error fetching product" , error : error});
    }
}