const { NextFunction, Request, response } = require("express");
const { SuccessResponse, BadRequestError, ApiError } = require("../core/index");
const { dbReader, dbWriter } = require("../models/dbconfig");
const { Op } = dbReader.Sequelize;

require("dotenv").config();
const { v4: uuidv4 } = require("uuid");
const _ = require("lodash");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const jwt = require("jsonwebtoken");
const jwt_secret = process.env.SECRET_KEY;
const moment = require("moment");
const { generateProductHexCode } = require("../helpers/general");

// ? firebase...
const admin = require('firebase-admin');
// Initialize Firebase Admin SDK
const serviceAccount = require('../helpers/serviceAccountKey.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.FB_STORAGE_BUCKET_URL
});
const bucket = admin.storage().bucket();

class ProductController {
    // ? List all Products
    listProducts = async (req, res) => {
        try {
            let user_role = req.user.user_role
            var { page_record, page_no, search, filter_by, sort_field, sort_order } = req.body;
            var row_offset = 0,
                row_limit = 10;

            //Pagination
            if (page_record) { row_limit = parseInt(page_record); }
            if (page_no) { row_offset = page_no * page_record - page_record; }

            // Searching data by ingredient_name
            var SearchCondition = dbReader.Sequelize.Op.ne,
                SearchData = null;
            if (search) {
                SearchCondition = dbReader.Sequelize.Op.like;
                SearchData = "%" + search + "%";
            }

            //Sorting by name or email
            var sortField = "created_datetime",
                sortOrder = "DESC";
            // var sortField = 'name', sortOrder = 'ASC';
            var sortJoin = [[sortField, sortOrder]];
            sortOrder = sort_order;

            if (sort_field == "product_name") {
                sortJoin = [dbReader.Sequelize.literal("product_name"), sortOrder];
            } else if (sort_field == "stock") {
                sortJoin = [dbReader.Sequelize.literal("stock"), sortOrder];
            } else if (sort_field == "status") {
                sortJoin = [dbReader.Sequelize.literal("status"), sortOrder];
            }

            // filter...
            if (filter_by == "pricelow") {
                sortJoin = [dbReader.Sequelize.literal("rrr_price"), "ASC"];
            } else if (filter_by == "pricehigh") {
                sortJoin = [dbReader.Sequelize.literal("rrr_price"), "DESC"];
            }

            let whereCondition

            if (user_role === 0) {
                whereCondition = dbReader.Sequelize.and(
                    dbReader.Sequelize.or(
                        dbReader.Sequelize.where(dbReader.Sequelize.col('product_name'), {
                            [SearchCondition]: SearchData
                        }),
                        // dbReader.Sequelize.where(dbReader.Sequelize.col('product_code'), {
                        //     [SearchCondition]: SearchData
                        // })
                    ),
                    dbReader.sequelize.where(dbReader.sequelize.col('`wm_products`.`status`'), 1),
                    dbReader.sequelize.where(dbReader.sequelize.col('`wm_products`.`is_deleted`'), 0)
                )
            } else {
                whereCondition = dbReader.Sequelize.and(
                    dbReader.Sequelize.or(
                        dbReader.Sequelize.where(dbReader.Sequelize.col('product_name'), {
                            [SearchCondition]: SearchData
                        }),
                        dbReader.Sequelize.where(dbReader.Sequelize.col('product_code'), {
                            [SearchCondition]: SearchData
                        })
                    ),
                    dbReader.sequelize.where(dbReader.sequelize.col('`wm_products`.`is_deleted`'), 0)
                )
            }

            let getAllProducts = await dbReader.product.findAndCountAll({
                include: [{
                    model: dbReader.productCategory
                }, {
                    model: dbReader.productSubCategory
                }, {
                    model: dbReader.productPhotos,
                    order: [['img_sort_order', 'ASC']],
                    limit: 1,
                    where: {
                        is_deleted: 0
                    },
                }],
                where: whereCondition,
                order: [sortJoin],
                limit: row_limit,
                offset: row_offset
            })

            if (getAllProducts) {
                getAllProducts = JSON.parse(JSON.stringify(getAllProducts))

                let user_id = req.user.user_id
                let getCartDetails = await dbReader.shoppingList.findOne({
                    include: [{
                        model: dbReader.shoppingListItems,
                        where: {
                            is_deleted: 0
                        },
                        include: [{
                            model: dbReader.product,
                        }]
                    }],
                    where: {
                        user_id: user_id,
                        is_deleted: 0
                    }
                })
                if (!_.isEmpty(getCartDetails)) {
                    getCartDetails = JSON.parse(JSON.stringify(getCartDetails))
                }
                if (getAllProducts.rows.length > 0) {
                    getAllProducts.rows = getAllProducts.rows.map(ele => {
                        let _pid = ele.product_id
                        if (getCartDetails && getCartDetails.wm_shopping_list_items.length > 0) {
                            let _qty = 0
                            getCartDetails.wm_shopping_list_items.map(i => {
                                if (i.product_id === _pid) {
                                    _qty = i.qty
                                }
                                // else {
                                //     _qty = 0
                                // }
                            })
                            return { ...ele, qty: _qty }
                        } else {
                            return { ...ele, qty: 0 }
                        }
                    })
                }
                return new SuccessResponse("List of products.", getAllProducts).send(res);

            } else {
                throw new Error("Data not found")
            }

        } catch (e) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    };

    // ? Product details
    getProductDetails = async (req, res) => {
        try {
            var { id } = req.params;
            let product_id = id

            let getProductData = await dbReader.product.findOne({
                include: [{
                    model: dbReader.productCategory
                }, {
                    model: dbReader.productSubCategory
                }, {
                    model: dbReader.productPhotos,
                    // limit: 1,
                    where: {
                        is_deleted: 0
                    },
                }],

                order: [[dbReader.Sequelize.col('`img_sort_order`'), 'ASC']],
                where: {
                    product_id: product_id,
                    is_deleted: 0
                }
            })

            if (getProductData) {
                getProductData = JSON.parse(JSON.stringify(getProductData))

                let user_id = req.user.user_id
                let getCartDetails = await dbReader.shoppingList.findOne({
                    include: [{
                        model: dbReader.shoppingListItems,
                        where: {
                            is_deleted: 0
                        },
                        include: [{
                            model: dbReader.product,
                        }]
                    }],
                    where: {
                        user_id: user_id,
                        is_deleted: 0
                    }
                })
                if (!_.isEmpty(getCartDetails)) {
                    getCartDetails = JSON.parse(JSON.stringify(getCartDetails))
                }

                let _pid = product_id
                if (getCartDetails && getCartDetails.wm_shopping_list_items.length > 0) {
                    let _qty = 0
                    getCartDetails.wm_shopping_list_items.map(i => {
                        if (i.product_id === _pid) {
                            _qty = i.qty
                        }
                    })
                    getProductData.qty = _qty
                } else {
                    getProductData.qty = 0
                }

            } else {
                throw new Error("Data not found")
            }

            return new SuccessResponse("Product details.", getProductData).send(res);

        } catch (e) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    };

    // ? Create products...
    addProduct = async (req, res) => {
        try {
            let { name, combinations } = req.body

            //  ? utilizing combinations
            let n = 0
            while (n < combinations.length) {
                let product_id = uuidv4(), status = 1
                let unixTimestamp = Math.floor(new Date().getTime() / 1000);
                let created_datetime = JSON.stringify(unixTimestamp),
                    updated_datetime = JSON.stringify(unixTimestamp);
                let product_code = await generateProductHexCode()
                // made object and add.
                let _obj = {
                    product_id: product_id,
                    product_code: product_code,
                    product_category_id: combinations[n].product_category_id,
                    product_subcategory_id: combinations[n].product_subcategory_id || "",
                    product_name: name,
                    product_description: combinations[n].description,
                    product_variant: combinations[n].product_variant,
                    unit_price: combinations[n].unit_price,
                    cost_price: combinations[n].cost_price,
                    rrr_price: combinations[n].rrr_price,
                    stock: combinations[n].stock,
                    attribute_color: combinations[n].attributes.Color || "",
                    attribute_material: combinations[n].attributes.Material || "",
                    attribute_shape: combinations[n].attributes.Shape || "",
                    attribute_size: combinations[n].attributes.Size || "",
                    status: status,
                    is_deleted: 0,
                    created_datetime: created_datetime,
                    updated_datetime: updated_datetime,
                }
                let createProduct = await dbWriter.product.create(_obj)
                if (createProduct) {
                    // * adding products images...
                    if (combinations[n].photo_url.length > 0) {
                        let m = 0, _img_sort_order = 1
                        while (m < combinations[n].photo_url.length) {
                            let product_photo_id = uuidv4()
                            let _photo_url = combinations[n].photo_url[m]
                            await dbWriter.productPhotos.create({
                                product_photo_id: product_photo_id,
                                product_id: product_id,
                                photo_url: _photo_url,
                                img_sort_order: _img_sort_order,
                                is_deleted: 0,
                                created_datetime: created_datetime,
                                updated_datetime: updated_datetime,
                            })
                            m++
                            _img_sort_order++
                        }
                    }
                }
                n++
            }
            return new SuccessResponse("Product added successfully.", {}).send(
                res
            );

        } catch (e) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    // ? Edit products...
    editProduct = async (req, res) => {
        try {
            let { id } = req.params
            let {
                product_category_id, product_subcategory_id, product_name, product_description,
                product_variant, unit_price, cost_price, rrr_price, stock, attribute_color, attribute_material,
                attribute_shape, attribute_size, photo_url, status
            } = req.body
            let product_id = id
            let unixTimestamp = Math.floor(new Date().getTime() / 1000);
            let created_datetime = JSON.stringify(unixTimestamp),
                updated_datetime = JSON.stringify(unixTimestamp);

            // validate product 
            // let _validateProduct = await dbReader.product.findOne({
            //     where: {
            //         product_name: product_name,
            //         is_deleted: 0
            //     }
            // })

            // if (!_.isEmpty(_validateProduct)) {
            //     throw new Error("Sorry, Same named product is alraedy exist.")
            // }

            let updateProduct = await dbWriter.product.update({
                product_category_id: product_category_id,
                product_subcategory_id: product_subcategory_id,
                product_name: product_name,
                product_description: product_description,
                product_variant: product_variant,
                unit_price: unit_price,
                cost_price: cost_price,
                rrr_price: rrr_price,
                stock: stock,
                attribute_color: attribute_color,
                attribute_material: attribute_material,
                attribute_shape: attribute_shape,
                attribute_size: attribute_size,
                updated_datetime: updated_datetime,
                status: status,
            }, {
                where: {
                    product_id: product_id,
                    is_deleted: 0
                }
            })

            // store images...
            if (updateProduct) {

                // delete old images
                let _getProductImages = await dbReader.productPhotos.findAll({
                    where: {
                        product_id: product_id,
                        is_deleted: 0
                    }
                })

                if (_getProductImages) {
                    _getProductImages = JSON.parse(JSON.stringify(_getProductImages))
                    if (_getProductImages.length > 0) {
                        let n = 0
                        while (n < _getProductImages.length) {
                            await dbWriter.productPhotos.update({
                                is_deleted: 1,
                                updated_datetime: updated_datetime,
                            }, {
                                where: {
                                    product_id: product_id,
                                    is_deleted: 0
                                }
                            })
                            n++
                        }
                    }
                }

                // * adding products images...
                if (photo_url.length > 0) {
                    let m = 0, _img_sort_order = 1
                    while (m < photo_url.length) {
                        let product_photo_id = uuidv4()
                        let _photo_url = photo_url[m]
                        await dbWriter.productPhotos.create({
                            product_photo_id: product_photo_id,
                            product_id: product_id,
                            photo_url: _photo_url,
                            img_sort_order: _img_sort_order,
                            is_deleted: 0,
                            created_datetime: created_datetime,
                            updated_datetime: updated_datetime,
                        })
                        m++
                        _img_sort_order++
                    }
                }
            }

            return new SuccessResponse("Product updated successfully.", {}).send(res);

        } catch (e) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    // ? Delete products...
    deleteProduct = async (req, res) => {
        try {
            let { id } = req.params
            let product_id = id
            let unixTimestamp = Math.floor(new Date().getTime() / 1000);
            let created_datetime = JSON.stringify(unixTimestamp),
                updated_datetime = JSON.stringify(unixTimestamp);

            // validate product
            let _validateProduct = await dbReader.product.findOne({
                where: {
                    product_id: product_id,
                    is_deleted: 0
                }
            })

            if (_.isEmpty(_validateProduct)) {
                throw new Error("Data not found.")
            } else {
                // ! NOTE => check product is already been order or not...
                let _validateProductToCart = await dbReader.userOrdersItems.findOne({
                    where: {
                        product_id: product_id,
                        is_deleted: 0
                    }
                })
                if (!_.isEmpty(_validateProductToCart)) {
                    throw new Error("Customers have already purchased this item, so it cannot be deleted.")
                }

                await dbWriter.product.update({
                    status: 0,
                    is_deleted: 1
                }, {
                    where: {
                        product_id: product_id,
                    }
                })

                // delete old images
                let _getProductImages = await dbReader.productPhotos.findAll({
                    where: {
                        product_id: product_id,
                        is_deleted: 0
                    }
                })

                if (_getProductImages) {
                    _getProductImages = JSON.parse(JSON.stringify(_getProductImages))
                    if (_getProductImages.length > 0) {
                        let n = 0
                        while (n < _getProductImages.length) {


                            await dbWriter.productPhotos.update({
                                is_deleted: 1,
                                updated_datetime: updated_datetime,
                            }, {
                                where: {
                                    product_id: product_id,
                                    is_deleted: 0
                                }
                            })
                            n++
                        }
                    }
                }


            }

            return new SuccessResponse("Product has been deleted successfully.", {}).send(
                res
            );

        } catch (e) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    // ? update stock
    updateStock = async (req, res) => {
        try {
            let { product_id, stock } = req.body
            let unixTimestamp = Math.floor(new Date().getTime() / 1000);
            let created_datetime = JSON.stringify(unixTimestamp),
                updated_datetime = JSON.stringify(unixTimestamp);

            // validate product
            let _validateProduct = await dbReader.product.findOne({
                where: {
                    product_id: product_id,
                    is_deleted: 0
                }
            })

            if (_.isEmpty(_validateProduct)) {
                throw new Error("Data not found.")
            } else {

                await dbWriter.product.update({
                    stock: stock,
                    updated_datetime: updated_datetime
                }, {
                    where: {
                        product_id: product_id,
                        is_deleted: 0
                    }
                })
            }

            return new SuccessResponse("Product stock has been upadted successfully.", {}).send(
                res
            );

        } catch (e) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    // ? upload product image
    uploadeProductImage = async (req, res) => {
        try {
            let { product_name, productIndex } = req.body
            let data = {}
            if (!req.file) {
                return res.status(400).send('No file uploaded.');
            }
            const sanitizedProductName = product_name.replace(/[^\w\s]/gi, '').replace(/\s+/g, '-').toLowerCase() + "_" + productIndex;
            const fileName = `products/${sanitizedProductName}/${req.file.originalname}_${Date.now()}.jpg`;
            const blob = bucket.file(fileName);
            const blobWriter = blob.createWriteStream({
                metadata: {
                    contentType: req.file.mimetype
                }
            });
            blobWriter.on('error', (err) => {
                console.error('Error uploading to Firebase:', err);
                res.status(500).send('Failed to upload image.');
            });

            blobWriter.on('finish', async () => {
                await blob.makePublic();
                const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
                // console.log('File uploaded to Storage:', publicUrl);
                // res.status(200).send(publicUrl);
                data.publicUrl = publicUrl
                return new SuccessResponse("Product stock has been upadted successfully.", data).send(res);
            });

            blobWriter.end(req.file.buffer);
        } catch (e) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    // * Product Category...

    // ? Add product category...
    addProductCategory = async (req, res) => {
        try {
            let { category_name, image_url, subcategoryArr } = req.body
            let unixTimestamp = Math.floor(new Date().getTime() / 1000);
            let created_datetime = JSON.stringify(unixTimestamp),
                updated_datetime = JSON.stringify(unixTimestamp);
            let product_category_id = uuidv4()

            // validate product category
            let _validateProductCategory = await dbReader.productCategory.findOne({
                where: {
                    category_name: category_name,
                    is_deleted: 0
                }
            })

            if (!_.isEmpty(_validateProductCategory)) {
                throw new Error("Sorry, Same named product category is already exist.")
            }

            let createProductCategory = await dbWriter.productCategory.create({
                product_category_id: product_category_id,
                category_name: category_name,
                image_url: image_url,
                is_deleted: 0,
                created_datetime: created_datetime,
                updated_datetime: updated_datetime,
            })

            // sub category
            if (subcategoryArr.length > 0) {
                let n = 0
                while (n < subcategoryArr.length) {
                    let product_subcategory_id = uuidv4()
                    await dbWriter.productSubCategory.create({
                        product_subcategory_id: product_subcategory_id,
                        product_category_id: product_category_id,
                        subcategory_name: subcategoryArr[n].subcategory_name,
                        image_url: subcategoryArr[n].image_url,
                        is_deleted: 0,
                        created_datetime: created_datetime,
                        updated_datetime: updated_datetime,
                    })
                    n++
                }
            }

            return new SuccessResponse("Product category added successfully.", createProductCategory).send(
                res
            );

        } catch (e) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    // ? Update product category...
    updateProductCategory = async (req, res) => {
        try {
            let { category_name, product_category_id, image_url, subcategoryArr } = req.body
            let unixTimestamp = Math.floor(new Date().getTime() / 1000);
            let created_datetime = JSON.stringify(unixTimestamp),
                updated_datetime = JSON.stringify(unixTimestamp);
            // validate product category
            let _validateProductCategory = await dbReader.productCategory.findOne({
                where: {
                    category_name: category_name,
                    is_deleted: 0
                }
            })
            if (!_.isEmpty(_validateProductCategory) && product_category_id != _validateProductCategory.product_category_id) {
                throw new Error("Sorry, Same named product category is already exist.")
            }
            // validate product category
            let ProductCategory = await dbReader.productCategory.findOne({
                include: [{
                    model: dbReader.productSubCategory
                }],
                where: {
                    product_category_id: product_category_id,
                    is_deleted: 0
                }
            })

            if (ProductCategory) {
                ProductCategory = JSON.parse(JSON.stringify(ProductCategory))
                let _productSubCategories = ProductCategory.wm_product_subcategories.map(i => i.product_subcategory_id)
                await dbWriter.productCategory.update({
                    category_name: category_name,
                    image_url: image_url,
                    updated_datetime: updated_datetime,
                }, {
                    where: {
                        product_category_id: product_category_id,
                        is_deleted: 0
                    }
                })
                // sub category
                if (subcategoryArr.length > 0) {
                    let n = 0
                    while (n < subcategoryArr.length) {
                        if (_productSubCategories.includes(subcategoryArr[n].product_subcategory_id)) {
                            await dbWriter.productSubCategory.update({
                                subcategory_name: subcategoryArr[n].subcategory_name,
                                // image_url: subcategoryArr[n].subcategory_name,
                                image_url: subcategoryArr[n].subcategory_name,
                                updated_datetime: updated_datetime,
                            }, {
                                where: {
                                    product_subcategory_id: subcategoryArr[n].product_subcategory_id,
                                    is_deleted: 0
                                }
                            })
                        } else if (subcategoryArr[n].product_subcategory_id == "0") {
                            let product_subcategory_id = uuidv4()
                            await dbWriter.productSubCategory.create({
                                product_subcategory_id: product_subcategory_id,
                                product_category_id: product_category_id,
                                subcategory_name: subcategoryArr[n].subcategory_name,
                                image_url: subcategoryArr[n].image_url,
                                is_deleted: 0,
                                created_datetime: created_datetime,
                            })
                        } else {
                            await dbWriter.productSubCategory.update({
                                is_deleted: 1
                            }, {
                                where: {
                                    product_subcategory_id: subcategoryArr[n].product_subcategory_id,
                                    is_deleted: 0
                                }
                            })
                        }
                        n++
                    }
                }
            }
            return new SuccessResponse("Product category updated successfully.", {}).send(res);

        } catch (e) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    // ? List product category...
    listProductCategory = async (req, res) => {
        try {
            let getAllProductsCategory = await dbReader.productCategory.findAll({
                include: [{
                    required: false,
                    model: dbReader.productSubCategory,
                    where: {
                        is_deleted: 0
                    }
                }],
                order: [['created_datetime', 'DESC']],
                where: {
                    is_deleted: 0
                }
            })
            if (getAllProductsCategory) {
                getAllProductsCategory = JSON.parse(JSON.stringify(getAllProductsCategory))
                return new SuccessResponse("List of products category.", getAllProductsCategory).send(
                    res
                );

            } else {
                throw new Error("Data not found")
            }

        } catch (e) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    };

    // ? Delete product category...
    deleteProductCategory = async (req, res) => {
        try {

            let { category_id, action } = req.body
            let unixTimestamp = Math.floor(new Date().getTime() / 1000);
            let created_datetime = JSON.stringify(unixTimestamp),
                updated_datetime = JSON.stringify(unixTimestamp);
            /**
             * action
             * 1. delete product category and sub category
             * 2. delete sub category only
             */

            switch (action) {
                case 1:
                    let _getCategory = await dbReader.productCategory.findOne({
                        include: [{
                            required: false,
                            model: dbReader.product,
                            where: {
                                is_deleted: 0
                            }
                        }],
                        where: {
                            product_category_id: category_id,
                            is_deleted: 0
                        }
                    })

                    if (_getCategory) {
                        _getCategory = JSON.parse(JSON.stringify(_getCategory))
                        if (_getCategory.wm_product) {
                            throw new Error("Can't delete this product category, it's already attached with product.")
                        } else {
                            await dbReader.productCategory.update({
                                is_deleted: 1,
                                updated_datetime: updated_datetime
                            }, {
                                where: {
                                    product_category_id: _getCategory.product_category_id,
                                    is_deleted: 0
                                }
                            })

                            await dbReader.productSubCategory.update({
                                is_deleted: 1,
                                updated_datetime: updated_datetime
                            }, {
                                where: {
                                    product_category_id: _getCategory.product_category_id,
                                    is_deleted: 0
                                }
                            })
                        }
                    } else {
                        throw new Error("Data not found.")
                    }
                    break;
                case 2:
                    let _getSubCategory = await dbReader.productSubCategory.findOne({
                        include: [{
                            required: false,
                            model: dbReader.product,
                            where: {
                                is_deleted: 0
                            }
                        }],
                        where: {
                            product_subcategory_id: category_id,
                            is_deleted: 0
                        }
                    })

                    if (_getSubCategory) {
                        _getSubCategory = JSON.parse(JSON.stringify(_getSubCategory))
                        if (_getSubCategory.wm_product) {
                            throw new Error("Can't delete this product category, it's already attached with product.")
                        } else {

                            await dbWriter.productSubCategory.update({
                                is_deleted: 1,
                                updated_datetime: updated_datetime
                            }, {
                                where: {
                                    product_subcategory_id: _getSubCategory.product_subcategory_id,
                                    is_deleted: 0
                                }
                            })
                        }
                    } else {
                        throw new Error("Data not found.")
                    }
                    break;

                default:
                    throw new Error("Something went wrong.")
                    break;
            }

            return new SuccessResponse("Category has been Deleted.", {}).send(
                res
            );


        } catch (e) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    };

    // ? Change Product status...
    changeProductStatus = async (req, res) => {
        try {
            let { product_id, status } = req.body
            let unixTimestamp = Math.floor(new Date().getTime() / 1000);
            let created_datetime = JSON.stringify(unixTimestamp),
                updated_datetime = JSON.stringify(unixTimestamp);
            /**
             * status
             * 1. Active
             * 2. De-active
             */
            let _validateProduct = await dbReader.product.findOne({
                where: {
                    product_id: product_id,
                    is_deleted: 0
                }
            })

            if (_.isEmpty(_validateProduct)) {
                throw new Error("Product does not exist.")
            }

            switch (status) {
                case 1:
                    await dbWriter.product.update({
                        status: 1,
                        updated_datetime: updated_datetime
                    }, {
                        where: {
                            product_id: product_id,
                            is_deleted: 0
                        }
                    })
                    break;
                case 2:
                    let _shoppingCartValidation = await dbReader.shoppingListItems.findOne({
                        where: {
                            product_id: product_id,
                            is_deleted: 0
                        }
                    })
                    if (!_.isEmpty(_shoppingCartValidation)) {
                        throw new Error("Customers have already purchased this item, so it cannot be de-activate.")
                    }
                    let _validateProductToCart = await dbReader.userOrdersItems.findOne({
                        where: {
                            product_id: product_id,
                            is_deleted: 0
                        }
                    })
                    if (!_.isEmpty(_validateProductToCart)) {
                        throw new Error("Customers have already purchased this item, so it cannot be de-activate.")
                    }

                    await dbWriter.product.update({
                        status: 2,
                        updated_datetime: updated_datetime
                    }, {
                        where: {
                            product_id: product_id,
                            is_deleted: 0
                        }
                    })
                    break;
                default:
                    throw new Error("Something went wrong.")
                    break;
            }
            return new SuccessResponse("Product status updated successfully.", {}).send(res);
        } catch (e) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    };

}

module.exports = ProductController;
