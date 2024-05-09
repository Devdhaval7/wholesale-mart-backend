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


class ProductController {
    // ? List all Products
    listProducts = async (req, res) => {
        try {
            var { page_record, page_no, search, sort_field, sort_order } = req.body;
            var row_offset = 0,
                row_limit = 10;

            //Pagination
            if (page_record) {
                row_limit = parseInt(page_record);
            }

            if (page_no) {
                row_offset = page_no * page_record - page_record;
            }

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
            } else if (sort_field == "price") {
                sortJoin = [dbReader.Sequelize.literal("price"), sortOrder];
            }

            let getAllProducts = await dbReader.product.findAndCountAll({
                include: [{
                    model: dbReader.productCategory
                }, {
                    model: dbReader.productSubCategory
                }, {
                    model: dbReader.productPhotos
                }],
                where: dbReader.Sequelize.and(
                    dbReader.Sequelize.or({
                        product_name: {
                            [SearchCondition]: SearchData
                        }
                    })
                ),
                order: [sortJoin],
                limit: row_limit,
                offset: row_offset
            })

            if (getAllProducts) {
                getAllProducts = JSON.parse(JSON.stringify(getAllProducts))

                return new SuccessResponse("List of products.", getAllProducts).send(
                    res
                );

            } else {
                throw new Error("Data not found")
            }

        } catch (e) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    };

    // ? Craete products...
    addProduct = async (req, res) => {
        try {

            let {
                product_category_id, product_subcategory_id, product_name, product_description,
                price, attribute_color, attribute_material, attribute_shape, attribute_size,
                status, product_images
            } = req.body
            let product_id = uuidv4()
            let unixTimestamp = Math.floor(new Date().getTime() / 1000);
            let created_datetime = JSON.stringify(unixTimestamp),
                updated_datetime = JSON.stringify(unixTimestamp);

            // validate product 
            let _validateProduct = await dbReader.product.findOne({
                where: {
                    product_name: product_name,
                    is_deleted: 0
                }
            })

            if (!_.isEmpty(_validateProduct)) {
                throw new Error("Sorry, Same named product is alraedy exist.")
            }

            let createProduct = await dbWriter.product.create({
                product_id: product_id,
                product_category_id: product_category_id,
                product_subcategory_id: product_subcategory_id,
                product_name: product_name,
                product_description: product_description,
                price: price,
                attribute_color: attribute_color,
                attribute_material: attribute_material,
                attribute_shape: attribute_shape,
                attribute_size: attribute_size,
                status: status,
                is_deleted: 0,
                created_datetime: created_datetime,
                updated_datetime: updated_datetime,
            })

            // store images...
            let formattedString = product_images.replace(/\[|\]|'/g, '');
            let _product_images = formattedString.split(',');
            if (_product_images.length > 0) {
                let n = 0, _img_sort_order = 1
                while (n < _product_images.length) {
                    let product_photo_id = uuidv4()
                    let _photo_url = _product_images[n]

                    await dbWriter.productPhotos.create({
                        product_photo_id: product_photo_id,
                        product_id: product_id,
                        photo_url: _photo_url,
                        img_sort_order: _img_sort_order,
                        is_deleted: 0,
                        created_datetime: created_datetime,
                        updated_datetime: updated_datetime,
                    })

                    n++
                    _img_sort_order++
                }
            }

            return new SuccessResponse("Product addedd successfully.", createProduct).send(
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
                price, attribute_color, attribute_material,
                attribute_shape, attribute_size, product_images
            } = req.body
            let product_id = id
            let unixTimestamp = Math.floor(new Date().getTime() / 1000);
            let created_datetime = JSON.stringify(unixTimestamp),
                updated_datetime = JSON.stringify(unixTimestamp);

            // validate product 
            let _validateProduct = await dbReader.product.findOne({
                where: {
                    product_name: product_name,
                    is_deleted: 0
                }
            })

            if (!_.isEmpty(_validateProduct)) {
                throw new Error("Sorry, Same named product is alraedy exist.")
            }

            let updateProduct = await dbWriter.product.update({
                product_category_id: product_category_id,
                product_subcategory_id: product_subcategory_id,
                product_name: product_name,
                product_description: product_description,
                price: price,
                attribute_color: attribute_color,
                attribute_material: attribute_material,
                attribute_shape: attribute_shape,
                attribute_size: attribute_size,
                updated_datetime: updated_datetime,
            }, {
                where: {
                    product_id: product_id,
                    is_deleted: 0
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

            // store images...
            let formattedString = product_images.replace(/\[|\]|'/g, '');
            let _product_images = formattedString.split(',');
            if (_product_images.length > 0) {
                let n = 0, _img_sort_order = 1
                while (n < _product_images.length) {
                    let product_photo_id = uuidv4()
                    let _photo_url = _product_images[n]
                    await dbWriter.productPhotos.create({
                        product_photo_id: product_photo_id,
                        product_id: product_id,
                        photo_url: _photo_url,
                        img_sort_order: _img_sort_order,
                        is_deleted: 0,
                        created_datetime: created_datetime,
                        updated_datetime: updated_datetime,
                    })
                    n++
                    _img_sort_order++
                }
            }

            return new SuccessResponse("Product updated successfully.", {}).send(
                res
            );

        } catch (e) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    // ? Add product category
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
                throw new Error("Sorry, Same named product category is alraedy exist.")
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

            return new SuccessResponse("Product category addedd successfully.", createProductCategory).send(
                res
            );

        } catch (e) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    // ? Product Category...

    // ? Update product category
    updateProductCategory = async (req, res) => {
        try {
            let { category_name, image_url, subcategoryArr } = req.body
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

            if (!_.isEmpty(_validateProductCategory)) {
                throw new Error("Sorry, Same named product category is alraedy exist.")
            }

            let updateProductCategory = await dbWriter.productCategory.update({
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

            return new SuccessResponse("Product category updated successfully.", updateProductCategory).send(
                res
            );

        } catch (e) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    }

    // ? List product category
    listProductCategory = async (req, res) => {
        try {
            let getAllProductsCategory = await dbReader.productCategory.findAll({
                include: [{
                    model: dbReader.productSubCategory
                }],
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

    // ? Delete product category
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
                        where: {
                            product_category_id: category_id,
                            is_deleted: 0
                        }
                    })

                    if (_getCategory) {
                        _getCategory = JSON.parse(JSON.stringify(_getCategory))
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

                    } else {
                        throw new Error("Data not found.")
                    }
                    break;
                case 2:
                    let _getSubCategory = await dbReader.productSubCategory.findOne({
                        where: {
                            product_category_id: category_id,
                            is_deleted: 0
                        }
                    })

                    if (_getSubCategory) {
                        _getSubCategory = JSON.parse(JSON.stringify(_getC_getSubCategoryategory))

                        await dbReader.productSubCategory.update({
                            is_deleted: 1,
                            updated_datetime: updated_datetime
                        }, {
                            where: {
                                product_category_id: _getSubCategory.product_category_id,
                                is_deleted: 0
                            }
                        })

                    } else {
                        throw new Error("Data not found.")
                    }
                    break;

                default:
                    throw new Error("Something went wrong.")
                    break;
            }

            return new SuccessResponse("List of products category.", {}).send(
                res
            );


        } catch (e) {
            ApiError.handle(new BadRequestError(e.message), res);
        }
    };

}

module.exports = ProductController;