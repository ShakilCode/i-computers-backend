import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
    {
        // every product has a unique ID to understand
        // This is the primary key of product
        productId: {
            type: String,
            // ID is mandatory
            required: true,
            // from one ID there should be only one porduct
            unique: true
        },

        // every product has a name
        name: {
            type: String,
            required: true
        },

        // every product has a description
        description: {
            type: String,
            required: true
        },

        // alternative names(extra names)
        altNames: {
            // string array because it may have more than 1 name
            type: [String],
            // default empty array
            default: []
        },

        // every product has a price and its mandatory
        price: {
            type: Number,
            required: true
        },

        // labelled a price and cut it because selling price is differnt than this
        labelledPrice: {
            type: Number
        },

        // every product has a category
        category: {
            type: String,
            // if no cateogry then it goes to others
            default: "Others"
        },

        // a product has many images and never save images in DB
        images: {
            type: [String],
            // only image links we put to the DB
            // there are more images it means its an string array or links array
            default: ["/images/default-product-1.png", "/images/default-product-2.png"]
        },

        // need to disable some products for some seasons (in stock, out of stock)
        isVisible: {
            type: Boolean,
            default: true,
            required: true
        },

        // some product has a brand like asus, mac
        brand: {
            type: String,
            // there is no brand then we put Generic
            default: "Generic"
        },

        model: {
            type: String,
            // if htere is no model then we put Standard
            default: "Standard"
        }
    }
)

const Product = mongoose.model("Product", productSchema)

export default Product