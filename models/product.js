import mongoose from "mongoose";

// Creating Product Schema
// This schema defines how each product document will look in MongoDB.
const productSchema = new mongoose.Schema(
    {
        // Unique ID for the product (not MongoDB _id — this is your own custom ID)
        // This is the primary key of product
        // must be provided
        // no two products can have same productId
        productId: {
            type: String,
            required: true,
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

        // Alternative names or nicknames for the product
        // string array because it may have more than 1 name (e.g., ["CPU", "Precessesor"])
        // empty array if no alternative names
        altNames: {
            type: [String],
            default: []
        },

        // every product has a selling price and its mandatory
        price: {
            type: Number,
            required: true
        },

        // labelled a price and cut it because selling price is differnt than this
        // Useful when showing “discounted price”
        labelledPrice: {
            type: Number
        },

        // every product has a category
        // if no cateogry then it goes to others
        category: {
            type: String,

            default: "Others"
        },

        // Product images – we never store the actual image file in DB,
        // only the image URLs or file paths.
        // there are more images it means its an string array or links array
        images: {
            type: [String],
            default: ["/images/default-product-1.png", "/images/default-product-2.png"]
        },

        // Show or hide product on website (useful for out-of-stock/seasonal items)
        isVisible: {
            type: Boolean,
            default: true,
            required: true
        },

        // Brand name of the product (e.g., ASUS, Apple, Nike)
        // there is no brand then we put Generic
        brand: {
            type: String,
            default: "Generic"
        },

        // Model name of the product
        // if htere is no model then we put Standard
        model: {
            type: String,
            default: "Standard"
        }
    }
)

// Convert schema into a model to interact with MongoDB
const Product = mongoose.model("Product", productSchema)

// Export model so it can be used in routes/controllers
export default Product