const express = require("express");
const app = express();
const router = express.Router();
const db = require('../models');
const CryptoJS = require("crypto-js");
const fs = require('fs');
const util = require("util");
const multer = require("multer");
const { Sequelize, Op } = require('sequelize');

// const mkdirSync = util.promisify(fs.mkdirSync);

app.model = (model) => db[model];


const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        var directory;
        // console.log(req.body);

        if (req.body.type == "user") {
            directory = "./api/resource/images/users/" + req.body.idOfType;
        }
        if (req.body.type == "ingredient") {
            directory = "./api/resource/images/ingredient/";
        }
        if (req.body.type == "recipe") {
            directory = "./api/resource/images/recipe/" + req.body.title.replace(/\s/g, '');
        }
        if (req.body.type == "branch_restaurant") {
            directory = "./api/resource/images/branch_restaurant/" + req.body.idOfType;
        }
        if (req.body.type == "food") {
            directory = "./api/resource/images/food/" + req.body.idOfType;
        }
        if (req.body.type == "category") {
            directory = "./api/resource/images/category/";
        }
        if (req.body.type == "restaurant") {
            directory = "./api/resource/images/restaurant/";
        }
        if (fs.existsSync(directory)) {
            console.log("Directory exists.");
        } else {
            fs.mkdirSync(directory, { recursive: true });
        }
        cb(null, directory);
    },
    filename: function(req, file, cb) {
        var extension = file.originalname.split(".");
        cb(null, CryptoJS.SHA1(extension[0]) + "-" + Math.round((new Date()).getTime() / 1000) + '.' + extension[1]);
    }
});

const fileFilter = async(req, file, cb) => {
    const body = req.body;
    typeSelct = body.type;
    console.log("typeSelct");

    try {
        finder = await app.model(typeSelct).findByPk(body.idOfType);
        if (finder) {
            if (file.mimetype == "image/jpeg" || file.mimetype == "image/jpg" || file.mimetype == "image/png" || file.mimetype == "image/gif") {
                cb(null, true);
            } else {
                req.fileValidationError = 'Suba solo imagenes/gifs';
                return cb('Suba solo imagenes/gifs');
            }
        } else {
            return cb(typeSelct + ' don´t exist');
        }
    } catch (error) {
        return cb(error.message);
    }
}

const upload = multer({ storage: storage, fileFilter: fileFilter }).single('imageSend');

router.post("/login", (req, res) => {
    const response = new Object();
    var passwordEncripted = CryptoJS.SHA1(req.body.password).toString();
    console.log(passwordEncripted);
    response.status = 'fail';

    db.user.findOne({
        where: {
            email: req.body.email,
        }
    }).then((user) => {
        if (user != null) {
            if (user.password == passwordEncripted) {
                response.status = 'success';
                response.api_token = 'alsjablksjbalkjsbas';
                response.user = user;
            } else {
                response.status = 'fail';
                response.error = 'contraseña incorrecta';
            }
        } else {
            response.status = 'fail';
            response.error = 'usuario inexistente';
            res.send(response);
        }
        res.send(response);
    });

});

router.post('/checkUser', (req, res) => {
    const response = new Object();
    db.user.findOne({ where: { email: req.body.email } })
        .then((user) => {
            if (user != null) {
                response.status = "success";
                response.user = user;
                res.send(response);
            } else {
                response.status = "fail";
                // response.user = user;
                res.send(response);
            }
        });
});

router.get('/getAllUsers', (req, res) => {
    const response = new Object();
    db.user.findAll()
        .then((users) => {
            if (users != null) {
                response.status = "success";
                response.users = users;
                res.send(response);
            } else {
                response.status = "fail";
                // response.user = user;
                res.send(response);
            }
        });
});

router.get('/getChats', async(req, res) => {
    const response = new Object();
    // Se obtienen los user_chat donde se encuentra el usuario
    var base_chats = await db.user_chat.findAll({ include: [db.chat], attributes: ['idChat'], where: { idUser: req.query.idUser }, });
    if (base_chats != null) {
        var chats = [];
        // Se recorren todos los idChat a los que pertenece y se buscan y listan los usuarios de cada uno
        // Se guarda en un array la informacion del chat y los usuarios que pertenecen a cada uno
        for (const chat of base_chats) {
            var new_chat = Object();
            new_chat.id = chat.idChat;
            new_chat.name = chat.chat.nameChat;
            new_chat.users = [];
            var usersByChat = await db.user_chat.findAll({ include: [db.user], attributes: ['idUser'], where: { idChat: chat.idChat } });
            for (const user of usersByChat) {
                var user_in_chat = Object();
                user_in_chat.idUser = user.idUser;
                user_in_chat.names = user.user.names;
                user_in_chat.surnames = user.user.surnames;
                user_in_chat.email = user.user.email;
                new_chat.users.push(user_in_chat);
            }

            // console.log(new_chat);
            chats.push(new_chat);
        }

        // console.log(chats);
        response.status = "success";
        response.chats = chats;
    } else {
        response.status = "fail";
    }
    res.send(response);
    // res.send(base_chats);
});

router.get('/getMessages', async(req, res) => {
    const response = new Object();
    // Se obtienen los user_chat donde se encuentra el usuario

    var whereCondition = {}

    // Si el idChat recibido por el request no es nulo ni vacio se agrega condicion
    if (req.query.idChat != undefined && req.query.idChat != '' && req.query.idChat > 0) {
        whereCondition.idChat = req.query.idChat;
    } else {
        response.status = "fail";
        errors = response.errors != undefined ? response.errors : [];
        errors.push("Incorrect idChat");
        response.errors = errors;
    }

    // Si el idChat recibido por el request no es nulo ni vacio se agrega condicion
    if (req.query.idMessage != undefined && req.query.idMessage != '') {
        if (req.query.idMessage > 0) {
            try {
                whereCondition.idMessage = {
                    [db.op.lt]: parseInt(req.query.idMessage)
                };
            } catch (error) {
                console.log(error);

            }
        } else {
            response.status = "fail";
            errors = response.errors != undefined ? response.errors : [];
            errors.push("Incorrect idMessage");
            response.errors = errors;
        }
    }

    if (response.errors == undefined) {

        var user_chat = await db.user_chat.findAll({ where: { idChat: req.query.idChat, idUser: req.query.idUser } });
        if (user_chat != null) {
            var last10Messages = await db.message.findAll({
                where: whereCondition,
                order: [
                    ['idMessage', 'DESC']
                ],
                limit: req.query.limit != undefined ? parseInt(req.query.limit) : 10
            });
            if (last10Messages != null) {
                var messages = [];
                // // Se recorren todos los idChat a los que pertenece y se buscan y listan los usuarios de cada uno
                // // Se guarda en un array la informacion del chat y los usuarios que pertenecen a cada uno
                for (const message of last10Messages) {
                    var new_message = Object();
                    new_message.idMessage = message.idMessage;
                    new_message.idChat = message.idChat;
                    new_message.idSender = message.idSender;
                    new_message.message = message.message;
                    new_message.createdAt = message.createdAt;
                    messages.push(new_message);
                }

                response.status = "success";
                response.messages = messages;
            }
        }
    }

    res.send(response);
});

router.post("/checkMail", (req, res) => {
    const response = new Object();
    var body = req.body;
    console.log(body.email);

    db.user.findAll({
        where: { email: body.email }
    }).then((err) => {
        if (err.length != 0) {
            response.status = "fail";
            response.description = "Usuario existente";
            res.send(response);
        }
        if (err.length == 0) {
            response.status = "success";
            response.description = "Usuario inexistente";
            res.send(response);
        }
    });
});

router.post("/signup", async(req, res) => {
    const response = new Object();
    var body = req.body;

    const [user, created] = await db.user.findOrCreate({
        where: { email: body.email },
        defaults: {
            names: body.names,
            surnames: body.surnames,
            bornDate: body.bornDate,
            gender: body.gender,
            interestedIn: body.interestedIn,
            email: body.email,
            lookingFor: body.lookingFor,
            lifeStyle: body.lifeStyle,
            password: CryptoJS.SHA1(body.password).toString(),
            f_active: 1,
            nickName: body.email.split("@")[0]
        }
    });

    if (created) {
        response.status = 'success';
        response.message = "user created";
        response.api_token = 'alsjablksjbalkjsbas';
        response.user = user;
    } else {
        response.status = "fail";
        response.message = "existing user";
    }
    res.send(response);
});

router.post('/uploadImage', async(req, res) => {
    const response = new Object();
    await upload(req, res, async(err) => {
        if (err) {
            console.log("Error: " + JSON.stringify(err));

            response.status = 'fail';
            response.message = err;
        } else {
            try {
                var obj = {
                    type: req.body.type,
                    principal: req.body.principal,
                    route: req.file.path
                };
                switch (req.body.type) {
                    case 'user':
                        obj.idUser = req.body.idOfType;
                        break;
                    case 'recipe':
                        obj.idRecipe = req.body.idOfType;
                        break;
                    case 'branch_restaurant':
                        obj.fkidBranchRestaurantImage = req.body.idOfType;
                        break;
                    case 'food':
                        obj.idFood = req.body.idOfType;
                        break;
                    default:
                        break;
                }
                const image = await app.model("image_" + req.body.type).create(obj);
                if (image) {
                    response.status = 'success';
                    response.message = "Image Uploaded";
                    response.image = image;
                } else {
                    response.status = 'fail';
                    response.message = "Something happend";
                }
            } catch (error) {

                response.status = 'fail';
                response.message = error.message;
            }
        }
        res.send(response);
    });
});

const ingredientFilter = async(req, file, cb) => {
    // console.log(file);
    if (file.mimetype == "image/jpeg" || file.mimetype == "image/jpg" || file.mimetype == "image/png") {
        cb(null, true);
    } else {
        req.fileValidationError = 'Suba solo imagenes/gifs';
        return cb('Suba solo imagenes/gifs');
    }
}

const uploadIngredient = multer({ storage: storage, fileFilter: ingredientFilter }).single('imageSend');

router.post('/saveIngredient', async(req, res) => {
    const response = new Object();
    var dirImg;
    await uploadIngredient(req, res, async(err) => {
        if (typeof req.file !== "undefined") {
            response.message = "immage send";
            dirImg = "./api/resource/images/ingredient/" + req.file.path;
        } else {
            response.status = 'fail';
            response.message = err;
            dirImg = "./api/resource/images/ingredient/default.jpg";
        }
        const [ingredient, created] = await db.ingredient.findOrCreate({
            where: { name: req.body.name },
            defaults: {
                name: req.body.name,
                routeImage: dirImg
            }
        });

        if (created) {
            response.status = 'success';
            response.message = "ingredient created";
            response.ingredient = ingredient;
        } else {
            response.status = "fail";
            response.message = "existing ingredient";
        }
        res.send(response);
    });
});


const recipeFilter = async(req, file, cb) => {
    if (file.mimetype == "image/jpeg" || file.mimetype == "image/jpg" || file.mimetype == "image/png" || file.mimetype == "image/gif") {
        cb(null, true);
    } else {
        req.fileValidationError = 'Suba solo imagenes/gifs';
        return cb('Suba solo imagenes/gifs');
    }
}

const uploadRecipie = multer({ storage: storage, fileFilter: recipeFilter }).array('images', 6);

router.post("/generateRecipe", async(req, res) => {
    const response = new Object();
    var dirImg;
    await uploadRecipie(req, res, async(err) => {
        if (err) {
            response.status = "fail";
            response.message = err;
        } else {
            if (req.files.length != 0) {
                dirImg = req.files.map(file => {
                    var obj = {};
                    obj["principal"] = 1;
                    obj["route"] = file.path;
                    return obj
                });
            } else {
                dirImg = [{ "principal": 1, "route": "api/resource/images/recipe/default.jpg" }];
            }
            try {
                var existRecipe = await db.recipe.findOne({ where: { title: req.body.title } });
                if (existRecipe) {
                    response.status = "fail";
                    response.message = "existing recipe";
                } else {
                    const dataStep = JSON.parse(req.body.stepRecipe);
                    const dataIngredients = JSON.parse(req.body.recipeIngredient);
                    const recipe = await db.recipe.create({
                        title: req.body.title,
                        description: req.body.description,
                        likes: req.body.likes,
                        step_recipes: dataStep,
                        recipe_ingredients: dataIngredients,
                        image_recipes: dirImg
                    }, {
                        include: [db.step_recipe, db.recipe_ingredient, db.image_recipe]
                    });
                    if (recipe) {
                        response.status = "success";
                        response.message = recipe;
                    } else {
                        response.status = "fail";
                        response.message = "error insertando";
                    }
                }
            } catch (error) {
                response.status = "fail";
                response.status = error.message;
            }
        }
        res.send(response);
    });
});

router.get("/getLikedRecipe", async(req, res) => {
    const response = new Object();
    try {
        var recipes = await db.recipe.findAll({
            limit: 10,
            order: [
                ['likes', 'DESC']
            ],
            include: [{
                model: db.image_recipe,
                where: { principal: 1 }
            }]
        });
        if (recipes) {
            response.status = "success";
            response.message = recipes;
        } else {

        }
    } catch (error) {
        response.status = "fail";
        response.message = "not recipes";
    }
    res.send(response);
});

router.get("/getLastsRecipe", async(req, res) => {
    const response = new Object();
    try {
        var recipes = await db.recipe.findAll({
            limit: 5,
            order: [
                ['idRecipe', 'DESC']
            ],
            include: [{
                model: db.image_recipe,
                where: { principal: 1 }
            }]
        });
        if (recipes) {
            response.status = "success";
            response.message = recipes;
        } else {
            response.status = "fail";
            response.message = "not recipes";
        }
    } catch (error) {
        response.status = "fail";
        response.message = error.message;
    }
    res.send(response);
});

router.get("/getRandomRecipe", async(req, res) => {
    var idExisting;
    if (req.body.idExisting) {
        idExisting = JSON.parse(req.body.idExisting);
    } else {
        idExisting = []
    }

    var moreRandom = await db.recipe.findAll({
        limit: 10,
        order: Sequelize.literal('rand()'),
        where: {
            idRecipe: {
                [Op.notIn]: idExisting,
            }
        },
        include: [{
            model: db.image_recipe,
            where: { principal: 1 }
        }]
    });
    res.send(moreRandom);
});

router.get("/getRecipe", async(req, res) => {
    const response = new Object();
    var recipe = await db.recipe.findByPk(
        req.body.idRecipe, {
            include: [
                { model: db.step_recipe },
                { model: db.recipe_ingredient },
                { model: db.image_recipe }
            ]
        }
    );
    if (recipe) {
        response.status = "success";
        response.message = recipe;
    } else {
        response.status = "fail";
        response.message = "404 recipe not found";
    }
    res.send(response);
});

const restaurantLogoFilter = async(req, file, cb) => {
    try {

        finder = await db.restaurant.findOne({
            where: { name: req.body.name }

        });

        if (!finder) {

            if (file.mimetype == "image/jpeg" || file.mimetype == "image/jpg" || file.mimetype == "image/png") {
                cb(null, true);

                console.log('true');

            } else {
                req.fileValidationError = 'Suba solo imagenes/gifs';
                console.log('false');
                return cb('Suba solo imagenes/gifs');

            }

        } else {
            console.log(req.body.name + ' ya existe');
            return cb(req.body.name + ' ya existe');


        }
    } catch (error) {
        return cb(error.message);
    }
}
const uploadRestaurant = multer({ storage: storage, fileFilter: restaurantLogoFilter }).single('imageSend');

router.post('/addRestaurant', async(req, res) => {
    const response = new Object();
    //const body=req.body;
    //const restaurant_notspace =req.body.name.replace(/^\s+|\s+$/g, "").replace(/\s+/g, " ");
    var dirImg;
    await uploadRestaurant(req, res, async(err) => {
        if (typeof req.file !== "undefined") {
            response.message = "immage send";
            dirImg = req.file.path;
        } else {
            response.status = 'fail';
            response.message = err;
            dirImg = "api/resource/images/restaurant/default.jpg";
        }
        const [restaurant, create] = await db.restaurant.findOrCreate({
            where: { name: req.body.name },
            defaults: {
                name: req.body.name,
                description: req.body.description,
                route: dirImg
            }
        });

        if (create) {
            response.status = 'success';
            response.message = "Restaurant created";
            response.restaurant = restaurant;
        } else {
            response.status = "fail";
            response.message = "existing Restaurant";
        }
        res.send(response);
    });
});

//consulta las comidas que pertenece a ese sucursal con su respectivo likes que tiene ese branch (count)
//Habilitado en food1.dart
router.get("/getFoodBranches1", async(req, res) => {

    const response = new Object();
    var food_branch = await db.food_branch.findAll({

            where: { fkidBranchRestaurantFB: req.query.fkidBranchRestaurantFB },
            //group: ['fkidFood'],
            group: ['food.idFood'],

            include: [{
                model: db.food,
                where: { idFoodCategory: req.query.idFoodCategory },
                attributes: ['idFood', 'name', 'description', 'price', 'idFoodCategory', [Sequelize.fn('COUNT', Sequelize.col('fkidFood')), 'count']],
                include: [{
                        model: db.food_user,
                        attributes: [], //le agregue esta linea
                        where: {
                            like: 1
                        },
                        required: false,
                    },
                    { model: db.image_food },
                    { model: db.food_category }
                ],

            }],
            order: [
                ['idFood']
            ]
        }

    );
    if (food_branch) {

        response.results = food_branch;
    } else {
        response.status = "fail";
        response.message = "404 FoodBranches not found";
    }
    res.send(response);
});
//esta en food1.dart y restaurant_provider busca si el usuario a dado like a esas comidas de esa sucursal
router.get("/getlikeuser", async(req, res) => {

    const response = new Object();
    var food_branch = await db.food_branch.findAll({

            where: { fkidBranchRestaurantFB: req.query.fkidBranchRestaurantFB },
            group: ['idFood'],
            attributes: ['idFood', 'fkidBranchRestaurantFB'],

            include: [{
                model: db.food,
                where: { idFoodCategory: req.query.idFoodCategory },
                attributes: ['idFood', 'name'],

                include: [{
                    model: db.food_user,
                    attributes: ['like', 'fkidFood', 'idUser'],
                    where: { idUser: req.query.idUser },
                    required: false,

                }, ],

            }],
            order: [

                ['idFood']
            ]
        }

    );
    if (food_branch) {
        //response.status="success";
        response.results = food_branch;
    } else {
        response.status = "fail";
        response.message = "404 FoodBranches not found";
    }
    res.send(response);
});

//consulta de las sucursal con sus respectivos horarios imagenes,comentarios,usuario,categoria,comida, imagenes de comida
//se lo utiliza en restaurant.dart y restaurant_provider
router.get("/getRestaurantAll1", async(req, res) => {

    const response = new Object();
    var restaurant = await db.restaurant.findAll({

            order: [
                [db.branch_restaurant, 'idBranchRestaurant', 'asc']
            ],

            include: [{
                model: db.branch_restaurant,
                include: [{ model: db.food_branch, include: [{ model: db.food, include: [{ model: db.image_food }, { model: db.food_category }] }] }, { model: db.restaurant_schedule }, { model: db.image_branch_restaurant }, { model: db.assessment_restaurant, include: [{ model: db.user }] }]
            }]
        }

    );
    if (restaurant) {

        response.results = restaurant;
    } else {
        response.status = "fail";
        response.message = "404 branch not found";
    }
    res.send(response);
});


//esta en food2.dart y restaurant_provider 
//busca la comida que pone en el search donde le aparece la comida buscada con su cantidad de like que tiene esa comida (count)
router.get("/getBranchFoodSearch1", async(req, res) => {
    const response = new Object();
    const Op = Sequelize.Op;
    const foodname = req.query.name;
    var food_branch = await db.food_branch.findAll({

            where: { fkidBranchRestaurantFB: req.query.fkidBranchRestaurantFB },

            //group: ['fkidFood'],
            group: ['food.idFood'],
            order: ['idFood'],

            include: [{
                model: db.food,
                where: {
                    name: {
                        [Op.startsWith]: foodname

                    }
                },
                attributes: ['idFood', 'name', 'description', 'price', 'idFoodCategory', [Sequelize.fn('COUNT', Sequelize.col('fkidFood')), 'count']],
                include: [{ model: db.image_food }, { model: db.food_category }, {
                    model: db.food_user,
                    attributes: [],
                    where: {
                        like: 1
                    },
                    required: false,
                }]
            }, { model: db.branch_restaurant, attributes: ['idBranchRestaurant', 'name'], include: [{ model: db.image_branch_restaurant }] }]

        }

    );
    if (food_branch) {

        response.results = food_branch;
    } else {
        response.status = "fail";
        response.message = "404 branch not found";
    }
    res.send(response);

});
//esta en food2.dart y restaurant_provider 
//busca la comida que pone en el search donde le aparece la comida buscada con su cantidad de like que tiene esa comida (count)
router.get("/getBranchFoodSearch2", async(req, res) => {
    const response = new Object();
    const Op = Sequelize.Op;
    const foodname = req.query.name;
    var food_branch = await db.food_branch.findAll({

            where: { fkidBranchRestaurantFB: req.query.fkidBranchRestaurantFB },

            //group: ['fkidFood'],
            group: ['food.idFood'],
            order: ['idFood'],

            include: [{
                model: db.food,
                attributes: ['idFood', 'name', 'description', 'price', 'idFoodCategory', [Sequelize.fn('COUNT', Sequelize.col('fkidFood')), 'count']],
                include: [{ model: db.image_food }, { model: db.food_category }, {
                    model: db.food_user,
                    attributes: [],
                    where: {
                        like: 1
                    },
                    required: false,
                }]
            }, { model: db.branch_restaurant, attributes: ['idBranchRestaurant', 'name'], include: [{ model: db.image_branch_restaurant }] }]

        }

    );
    if (food_branch) {

        response.results = food_branch;
    } else {
        response.status = "fail";
        response.message = "404 branch not found";
    }
    res.send(response);

});
//esta en food2.dart consulta todas las comida de esa sucursal con su respectivo like de dicho usuario 
router.get("/getFoodLikeUser", async(req, res) => {

    const response = new Object();
    var branch_restaurant = await db.branch_restaurant.findAll({
            attributes: ['idBranchRestaurant'],
            where: { idBranchRestaurant: req.query.idBranchRestaurant },

            include: [{
                model: db.food_branch,
                attributes: ['idFoodBranch', 'idFood'],
                include: [{
                    model: db.food,

                    attributes: ['idFood'],
                    include: [{ model: db.food_user, attributes: ['idUser', 'like'], where: { idUser: req.query.idUser }, required: false }]
                }]
            }]

        }

    );
    if (branch_restaurant) {

        responseSearch = branch_restaurant;

        if (responseSearch) {

        } else {

        }
        response.results = branch_restaurant;
    } else {
        response.status = "fail";
        response.message = "404 branch not found";
    }
    res.send(response);
});
//esta en food2.dart consulta la comida a buscar en el search donde traera el like del usuario 
router.get("/getFoodLikeUser1", async(req, res) => {

    const response = new Object();
    const Op = Sequelize.Op;
    const foodname = req.query.name;
    var branch_restaurant = await db.branch_restaurant.findAll({
            attributes: ['idBranchRestaurant'],
            where: { idBranchRestaurant: req.query.idBranchRestaurant },
            raw: true,
            //order:['idFood'],

            include: [{
                model: db.food_branch,
                attributes: ['idFood'],
                include: [{
                    model: db.food,

                    where: {
                        name: {
                            [Op.startsWith]: foodname
                        }
                    },


                    attributes: ['idFood'],
                    include: [{ model: db.food_user, attributes: ['idUser', 'like'], where: { idUser: req.query.idUser }, required: false }]
                }]
            }]

        }

    );
    if (branch_restaurant) {
        //response.status="success";
        responseSearch = branch_restaurant;

        if (responseSearch) {

        } else {

        }
        response.results = branch_restaurant;
    } else {
        response.status = "fail";
        response.message = "404 branch not found";
    }
    res.send(response);
});

//Habilitado en maps.dart
router.get("/getRestaurantImage", async(req, res) => {

    const response = new Object();
    var restaurant = await db.restaurant.findAll({
            order: ['idRestaurant'],
            attributes: ['route'],
        }

    );
    if (restaurant) {
        //response.status="success";
        response.results = restaurant;
    } else {
        response.status = "fail";
        response.message = "404 Image not found";
    }
    res.send(response);
});
//Habilitado en list_favorite_food.dart consulto el nombre y idrestaurant de todos los restaurantes
router.get("/getRestaurant", async(req, res) => {

    const response = new Object();
    var restaurant = await db.restaurant.findAll({
            order: ['idRestaurant'],
            attributes: ['idRestaurant', 'name'],
        }

    );
    if (restaurant) {
        //response.status="success";
        response.results = restaurant;
    } else {
        response.status = "fail";
        response.message = "404 Restaurant not found";
    }
    res.send(response);
});

//consulta todas las sucursales con sus respectivos horarios e imagenes
//Habilitado en maps.dart
router.get("/getRestaurantAll2", async(req, res) => {

    const response = new Object();
    var branch_restaurant = await db.branch_restaurant.findAll({

            include: [
                { model: db.restaurant_schedule },
                { model: db.image_branch_restaurant }
            ]
        }

    );
    if (branch_restaurant) {
        //response.status="success";
        response.results = branch_restaurant;
    } else {
        response.status = "fail";
        response.message = "404 branch not found";
    }
    res.send(response);
});

//filtra busqueda por nombre de restaurante
//Habilitado en restaurant_provider

router.get("/getSearchRestaurant", async(req, res) => {
    const Op = Sequelize.Op;
    const response = new Object();
    const restaurantname = req.query.name;
    var restaurant = await db.restaurant.findAll({

        where: {
            name: {
                [Op.startsWith]: restaurantname
            }
        },
        include: [{
            model: db.branch_restaurant,
            include: [{ model: db.food_branch, include: [{ model: db.food, include: [{ model: db.image_food }, { model: db.food_category }] }] }, { model: db.restaurant_schedule }, { model: db.image_branch_restaurant }, { model: db.assessment_restaurant, include: [{ model: db.user }] }]
        }]

    });
    console.log(restaurant);

    if (restaurant) {
        response.status = "success";
        response.results = restaurant;
    } else {
        response.status = "fail";
        response.message = "404 restaurant not found";
    }
    res.send(response);
});

//busca la comidad por nombre
//habilitado en restaurant_provider
router.get("/getSearchFood", async(req, res) => {
    const Op = Sequelize.Op;
    const response = new Object();
    const foodname = req.query.name;
    var food = await db.food.findAll({

        where: {
            name: {
                [Op.startsWith]: foodname
            }
        },
        include: [
            { model: db.food_branch, include: [{ model: db.branch_restaurant }] }, { model: db.food_category }, { model: db.image_food }
        ]

    });
    //console.log(food);

    if (food) {
        response.status = "success";
        response.results = food;
    } else {
        response.status = "fail";
        response.message = "404 food not found";
    }
    res.send(response);
});



router.post('/addBranchRestaurant', async(req, res) => {
    //idRestaurant:body.idRestaurant

    const response = new Object();
    const body = req.body;

    const branch_notspace = req.body.name.replace(/^\s+|\s+$/g, "").replace(/\s+/g, " ");


    console.log(branch_notspace);
    try {

        const restaurant_Exist = await db.restaurant.findByPk(body.idRestaurant);
        console.log(restaurant_Exist);

        if (restaurant_Exist) {
            const [branch_restaurant, create] = await db.branch_restaurant.findOrCreate({
                where: { name: branch_notspace, idRestaurant: body.idRestaurant },
                defaults: {
                    name: branch_notspace,
                    isOpen: body.isOpen,
                    phoneNumber: body.phoneNumber,
                    address: body.address,
                    latitude: body.latitude,
                    longitude: body.longitude,
                    priceMedium: body.priceMedium,
                    webPage: body.webPage,
                    idRestaurant: body.idRestaurant
                }
            });
            if (create) {

                response.status = "success";
                response.name = branch_restaurant.name;
                response.idBranchRestaurant = branch_restaurant.idBranchRestaurant;
            } else {

                response.status = "fail";
                response.message = "Sucursal ya existente";
            }

        } else {
            response.status = "fail";
            response.message = "No existe este restaurant";

        }
    } catch (error) {
        response.status = "fail";
        response.message = error.message;
    }
    res.send(response);
});

//obtener por idbranchrestaurant sus respectivas comidas e imagenes
router.get("/getBranchRestaurant", async(req, res) => {
    const response = new Object();
    try {
        var branch_restaurant = await db.branch_restaurant.findByPk(
            req.query.idBranchRestaurant, {
                include: [{
                    model: db.food_branch,
                    include: [{
                        model: db.food,
                        include: [{ model: db.image_food }]
                    }]
                }]
            }
        );
        if (branch_restaurant) {
            //response.status="success";
            response.results = branch_restaurant;
        } else {
            response.status = "fail";
            response.message = "404 food not found";
        }
    } catch (error) {
        response.status = "fail";
        response.message = error.message;

    }
    res.send(response);
});


//obtener por idbranchrestaurant sus respectivas comidas en su categoria group by
router.get("/getBranchRestaurantFood", async(req, res) => {
    const response = new Object();
    try {
        var food = await db.food.findAll({
            include: [
                { model: db.food_category },

            ],

            group: ['idFoodCategory']

        });
        if (food) {
            response.results = food;
        } else {
            response.status = "fail";
            response.message = "404 food not found";
        }

    } catch (error) {
        response.status = "fail";
        response.message = error.message;
    }
    res.send(response);
});


router.post('/addRestaurantSchedule', async(req, res) => {
    const response = new Object();
    const body = req.body;
    try {
        const branch_Exist = await db.branch_restaurant.findByPk(body.fkidBranchRestaurantSchedule);
        console.log(branch_Exist);

        if (branch_Exist) {

            const [restaurant_schedule, create] = await db.restaurant_schedule.findOrCreate({
                where: {
                    fkidBranchRestaurantSchedule: body.fkidBranchRestaurantSchedule,
                    day: body.day
                },
                defaults: {
                    day: body.day,
                    startTime: body.startTime,
                    endTime: body.endTime,
                    fkidBranchRestaurantSchedule: body.fkidBranchRestaurantSchedule
                }
            });

            if (create) {

                response.status = "success";
                response.message = restaurant_schedule.fkidBranchRestaurantSchedule;
            } else {

                response.status = "fail";
                response.message = "Horario ya existente";
            }
        } else {
            response.status = "fail";
            response.message = "No existe este branch";
        }
    } catch (error) {
        response.status = "fail";
        response.message = error.message;
    }
    res.send(response);
});

router.post('/addFood', async(req, res) => {
    const response = new Object();
    const body = req.body;
    const food_notspace = req.body.name.replace(/^\s+|\s+$/g, "").replace(/\s+/g, " ");
    try {
        const category_Exist = await db.food_category.findByPk(body.idFoodCategory);
        console.log(category_Exist);

        if (category_Exist) {

            const [food, create] = await db.food.findOrCreate({
                where: { name: food_notspace, idFoodCategory: body.idFoodCategory, },
                defaults: {
                    name: food_notspace,
                    description: body.description,
                    price: body.price,
                    idFoodCategory: body.idFoodCategory
                }
            });
            if (create) {

                response.status = "success";
                response.message = food.name;

            } else {

                response.status = "fail";
                response.message = "Comida y/o bebida ya existente";
            }

        } else {
            response.status = "fail";
            response.message = "No existe esta categoria";

        }
    } catch (error) {
        response.status = "fail";
        response.message = error.message;
    }
    res.send(response);
});

router.post('/addFoodBranch', async(req, res) => {


    const response = new Object();
    const body = req.body;



    try {

        const [food_branch, create] = await db.food_branch.findOrCreate({

            where: { idFood: body.idFood, fkidBranchRestaurantFB: body.fkidBranchRestaurantFB },
            defaults: {

                idFood: body.idFood,
                fkidBranchRestaurantFB: body.fkidBranchRestaurantFB
            }

        });

        if (create) {
            response.status = "success";
            response.message = food_branch;
        } else {

            response.status = "fail";
            response.message = "Food branch ya existente";
        }

    } catch (error) {

        response.status = "fail";

        response.message = error.message;

    }
    res.send(response);

});

//anadir un comentario al branchrestaurant
//Habilitado en Homescreen2.dart 
router.post('/addassessmentrestaurant', async(req, res) => {
    const response = new Object();

    try {
        const branch_Exist = await db.branch_restaurant.findByPk(req.query.fkidBranchRestaurant);


        if (branch_Exist) {

            const [assessment_restaurant, create] = await db.assessment_restaurant.findOrCreate({

                where: { fkidBranchRestaurant: req.query.fkidBranchRestaurant, idUser: req.query.idUser },
                defaults: {
                    assessment: req.query.assessment,
                    commentary: req.query.commentary,
                    fkidBranchRestaurant: req.query.fkidBranchRestaurant,
                    idUser: req.query.idUser
                }


            });


            if (create) {

                response.status = "success";
                response.results = assessment_restaurant;

            } else {

                response.status = "fail";
                response.results = "ya diste un comentario de esta sucursal";
            }




        } else {
            response.status = "fail";
            response.message = "No existe este branch";
        }
    } catch (error) {
        response.status = "fail";
        response.message = error.message;
    }
    res.send(response);
});

//obtener el comentario con el idusuario y idbranch
//Habilitado en Homescreen2.dart  y restaurant_provider.dart
router.get("/getassessmentrestaurant", async(req, res) => {

    const response = new Object();


    try {
        var assessment_restaurant = await db.assessment_restaurant.findAll({

            where: { fkidBranchRestaurant: req.query.fkidBranchRestaurant, idUser: req.query.idUser },

        });

        if (assessment_restaurant) {
            response.status = "success";
            response.results = assessment_restaurant;
        } else {
            response.status = "fail";
            response.message = "404 assessment not found";
        }

    } catch (error) {
        response.status = "fail";
        response.message = error.message;
    }
    res.send(response);
});

//esta en UpdateAssessment.dart sirve para modificar el comentario del usuario
router.post("/updateAssessment", async(req, res) => {

    const response = new Object();


    try {

        const assessment_restaurant = await db.assessment_restaurant.update({

            assessment: req.query.assessment,
            commentary: req.query.commentary,

        }, {
            where: { fkidBranchRestaurant: req.query.fkidBranchRestaurant, idUser: req.query.idUser }
        });

        if (assessment_restaurant) {

            response.status = "success";
            response.message = assessment_restaurant;

        } else {
            response.status = "fail";
            response.message = "No se actualizo su comentario";
        }

    } catch (error) {

        response.status = "fail";
        response.message = error.message;

    }

    res.send(response)


});

//Habilitado en list_favorite_food.dart consulto todas las comidas de ese usuario a la que dio like
router.get("/getListFavoriteFood", async(req, res) => {

    const response = new Object();


    try {
        var food_user = await db.food_user.findAll({

            where: { idUser: req.query.idUser, like: 1 },
            include: [{
                model: db.food,
                include: [{
                    model: db.food_branch,
                    include: [{ model: db.branch_restaurant }]
                }]
            }, { model: db.food, include: [{ model: db.image_food }] }, { model: db.food, include: [{ model: db.food_category }] }]


        });


        if (food_user) {
            //response.status="success";
            response.results = food_user;
        } else {
            response.status = "fail";
            response.message = "404 FavoriteFood not found";
        }

    } catch (error) {
        response.status = "fail";
        response.message = error.message;
    }
    res.send(response);
});
//Habilitado en list_favorite_food.dart and restaurant_provider.dart
//consulta toda la comida del usuario solo si la comida tiene like=1 es para ver si la list de comida favorita esta vacia o no
router.get("/getListEmptyFavoriteFood", async(req, res) => {

    const response = new Object();

    try {
        var food_user = await db.food_user.findAll({

            where: { idUser: req.query.idUser, like: 1 },
        });


        if (food_user) {
            //response.status="success";
            response.results = food_user;
        } else {
            response.status = "fail";
            response.message = "404 List Empty";
        }

    } catch (error) {
        response.status = "fail";
        response.message = error.message;
    }
    res.send(response);
});
//Habilitado en list_favorite_food.dart
//obtener la cantidad de me gusta de cada comida favorita del usuario solo si dicha comida tiene like =1
router.get("/getLikeListFavorite", async(req, res) => {

    const response = new Object();


    try {
        var food_user = await db.food_user.findAll({

            where: { like: 1 },
            attributes: ['fkidFood', [Sequelize.fn('COUNT', Sequelize.col('fkidFood')), 'count']],
            group: ['fkidFood'],

        });


        if (food_user) {
            //response.status="success";
            response.results = food_user;
        } else {
            response.status = "fail";
            response.message = "404 restaurant not found";
        }

    } catch (error) {
        response.status = "fail";
        response.message = error.message;
    }
    res.send(response);
});
//sumar todo los assessment y dividirlo por la cantidad de usuarios que han comentado para darme el valor del assesment
//uno por uno
//Habilitado en restaurant_provider

router.get("/getvalorateAssessment", async(req, res) => {

    const response = new Object();

    try {
        var branch_restaurant = await db.branch_restaurant.findAll({
            //where:{idRestaurant:req.query.idRestaurant},
            group: ['idBranchRestaurant'],
            order: ['idBranchRestaurant'],
            attributes: [],
            include: [{
                model: db.assessment_restaurant,
                attributes: ['fkidBranchRestaurant', [Sequelize.fn('AVG', Sequelize.col('assessment')), 'avg']]


            }],

        });


        if (branch_restaurant) {
            response.status = "success";
            response.results = branch_restaurant;
        } else {
            response.status = "fail";
            response.message = "404 restaurant not found";
        }

    } catch (error) {
        response.status = "fail";
        response.message = error.message;
    }
    res.send(response);
});
//Habilitado en Maps2
router.get("/getvalorateAssessmentMaps", async(req, res) => {

    const response = new Object();


    try {
        var assessment_restaurant = await db.assessment_restaurant.findAll({
            //raw: true,

            where: { fkidBranchRestaurant: req.query.fkidBranchRestaurant },
            group: ['fkidBranchRestaurant'],

            attributes: ['fkidBranchRestaurant', [Sequelize.fn('AVG', Sequelize.col('assessment')), 'avg']

            ]

        });


        if (assessment_restaurant) {
            //response.status="success";
            response.results = assessment_restaurant;
        } else {
            response.status = "fail";
            response.message = "404 restaurant not found";
        }

    } catch (error) {
        response.status = "fail";
        response.message = error.message;
    }
    res.send(response);
});


//todas las comidas populares limite solo 10 comidas
//Habilitado en restaurant.dart y esta en restuarant_provider.dart
//todas las comidas mas populares esta limitada para 10 comidas y esta ordenado por cuantos like tiene cada comida y esta ordenado de mayor a menor count
router.get("/getPopularFood", async(req, res) => {

    const response = new Object();
    const prueba = new Object();
    var prueba2 = new Array();
    var food = await db.food.findAll({

            group: ['fkidFood'],
            attributes: ['idFood', 'name', 'description', 'price', 'idFoodCategory', [Sequelize.fn('COUNT', Sequelize.col('fkidFood')), 'count']],
            include: [{
                model: db.food_user,

                where: {
                    like: 1
                },
                attributes: [],


            }, { model: db.image_food }],

            //offset: 5, limit: 5,
            order: [

                [Sequelize.fn('COUNT', Sequelize.col('fkidFood')), 'DESC'],

            ],

        }

    );
    if (food) {
        //response.status="success";
        prueba.list = food;



        for (var index = 0; index < prueba.list.length; index++) {
            //const element = array[index];

            if (index < 10) {

                prueba2.push(prueba.list[index]);
            }


        }
        //console.log(prueba.list.length);


        response.results = prueba2;

    } else {
        response.status = "fail";
        response.message = "404 food not found";
    }
    res.send(response);
});
//general group idrestaurant esta ordenado de mayor a menor los assesment de cada restaurante
//esta en restaurant.dart y restaurant_provider.dart
router.get("/getvalorateAssessment1", async(req, res) => {

    const response = new Object();
    const prueba = new Object();
    var prueba2 = new Array();

    var branch_restaurant = await db.branch_restaurant.findAll({
            order: [

                [Sequelize.fn('AVG', Sequelize.col('assessment')), 'DESC'],

            ],
            raw: true,
            attributes: ['idRestaurant'],
            include: [{
                model: db.assessment_restaurant,
                attributes: [
                    [Sequelize.fn('AVG', Sequelize.col('assessment')), 'avg']
                ],


            }],
            group: ['branch_restaurant.idRestaurant'],

        }

    );
    if (branch_restaurant) {
        //response.status="success";

        prueba.list = branch_restaurant;



        for (var index = 0; index < prueba.list.length; index++) {
            //const element = array[index];

            if (index < 10) {

                prueba2.push(prueba.list[index]);
            }


        }
        //console.log(prueba.list.length);

        response.results = prueba2;


    } else {
        response.status = "fail";
        response.message = "404 branch not found";
    }
    res.send(response);
});

//assesment de cada restaurant esta ordenado por idRestaurant
//esta en restaurant.dart y restaurant_provider.dart
router.get("/getvalorateAssessment2", async(req, res) => {

    const response = new Object();
    var branch_restaurant = await db.branch_restaurant.findAll({
            raw: true,
            attributes: ['idRestaurant'],
            include: [{
                model: db.assessment_restaurant,
                attributes: [
                    [Sequelize.fn('AVG', Sequelize.col('assessment')), 'avg']
                ],


            }],
            group: ['branch_restaurant.idRestaurant'],

        }

    );
    if (branch_restaurant) {
        //response.status="success";
        response.results = branch_restaurant;
    } else {
        response.status = "fail";
        response.message = "404 branch not found";
    }
    res.send(response);
});

//esta en branch.dart y restaurant_provider.dart mediante el idrestaurant podre obtener todas las sucursales con su respectivo assessment esta ordenado por idBranchRestaurant
router.get("/getvalorateAssessment3", async(req, res) => {

    const response = new Object();

    try {
        var branch_restaurant = await db.branch_restaurant.findAll({
            where: { idRestaurant: req.query.idRestaurant },
            group: ['idBranchRestaurant'],
            order: ['idBranchRestaurant'],
            attributes: [],
            include: [{
                model: db.assessment_restaurant,
                attributes: ['fkidBranchRestaurant', [Sequelize.fn('AVG', Sequelize.col('assessment')), 'avg']]

            }],


        });


        if (branch_restaurant) {
            response.status = "success";
            response.results = branch_restaurant;
        } else {
            response.status = "fail";
            response.message = "404 restaurant not found";
        }

    } catch (error) {
        response.status = "fail";
        response.message = error.message;
    }
    res.send(response);
});


const categoryFilter = async(req, file, cb) => {

    try {
        finder = await db.food_category.findOne({
            where: { name: req.body.name }

        });

        if (!finder) {

            if (file.mimetype == "image/jpeg" || file.mimetype == "image/jpg" || file.mimetype == "image/png") {
                cb(null, true);

                console.log('true');

            } else {
                req.fileValidationError = 'Suba solo imagenes/gifs';
                console.log('false');
                return cb('Suba solo imagenes/gifs');

            }

        } else {
            console.log(req.body.name + ' ya existe');
            return cb(req.body.name + ' ya existe');


        }
    } catch (error) {
        return cb(error.message);
    }
}


const uploadCategory = multer({ storage: storage, fileFilter: categoryFilter }).single('imageSend');

router.post('/saveCategory', async(req, res) => {
    const response = new Object();
    var dirImg;
    await uploadCategory(req, res, async(err) => {
        if (typeof req.file !== "undefined") {
            response.message = "immage send";
            dirImg = req.file.path;
        } else {
            response.status = 'fail';
            response.message = err;
            dirImg = "api/resource/images/category/default.jpg";
        }
        const [food_category, created] = await db.food_category.findOrCreate({
            where: { name: req.body.name },
            defaults: {
                name: req.body.name,
                route: dirImg
            }
        });

        if (created) {
            response.status = 'success';
            response.message = "category created";
            response.food_category = food_category;
        } else {
            response.status = "fail";
            response.message = "existing category";
        }
        res.send(response);
    });
});
//consulta por idecategoria para visualizar las comidas y sus imagenes
router.get("/getFoodCategory", async(req, res) => {
    const response = new Object();
    try {
        var food_category = await db.food_category.findAll(

        );
        if (food_category) {
            response.results = food_category;
        } else {
            response.status = "fail";
            response.message = "404 category not found";
        }

    } catch (error) {
        response.status = "fail";
        response.message = error.message;
    }
    res.send(response);
});



//se elimina por idcategory y idfood la comida con su respectiva imagen pero no se elimina la imagen en el storage
router.post("/deleteFood", async(req, res) => {
    const response = new Object();
    const body = req.body;
    var food = await db.food.destroy({

            where: {
                [Op.and]: [
                    { idFoodCategory: body.idFoodCategory },
                    { idFood: body.idFood }
                ]
            },
            include: [
                { model: db.image_food },
                { model: db.food_branch }

            ],
        }

    );

    if (food) {
        response.status = "success";
        response.message = 'food delete';
    } else {
        response.status = "fail";
        response.message = "404 food not found";
    }
    res.send(response);
});


router.post("/getBranchRestaurantFood1", async(req, res) => {
    const response = new Object();
    const body = req.body;
    try {
        var food_branch = await db.food_branch.findAll({
            where: { idBranchRestaurant: body.idBranchRestaurant },
            attributes: ['idFood']
        });

        if (food_branch) {
            response.status = "success";
            response.message = food_branch;

            const food = await db.food.findAll({
                where: { idFoodCategory: body.idFoodCategory },
                attributes: ['idFood']
            });
            const respo = { food, food_branch };

            if (food) {
                response.status = "success";
                response.message = respo;

            } else {

                response.status = "fail";
                response.message = "404 food not found";

            }



        } else {
            response.status = "fail";
            response.message = "404 food not found";
        }

    } catch (error) {
        response.status = "fail";
        response.message = error.message;
    }
    res.send(response);
});
//actualizar datos


/*router.put("/updateBranch/:id",async (req, res) => {

    const response = new Object();
    const body=req.body;
    const body2=req.query;
    console.log(body);
    console.log(body2);
    
    try {
        var branch_restaurant = await db.branch_restaurant.update(
            { name:body.name,
                isOpen:body.isOpen,
                phoneNumber:body.phoneNumber,
                address:body.address,
                latitude:body.latitude,
                longitude:body.longitude,
                priceMedium:body.priceMedium,
                webPage:body.webPage },
    
             { where: { idBranchRestaurant: req.params.id} }
             
             )  
             if(branch_restaurant){
                response.status="success";
                response.message=branch_restaurant;
            }else{
                response.status="fail";
                response.message="404 branch not found";
            }
        
    } catch (error) {
        response.status="fail";
        response.message=error.message;
        
    }
    res.send(response);
  });*/
//se actualiza del restaurante

router.post("/updateRestaurant", async(req, res) => {

    const response = new Object();
    const body = req.body;

    try {

        const restaurant = await db.restaurant.update({

                name: body.name,
                description: body.description

            }, {
                where: { idRestaurant: body.idRestaurant }
            }

        );

        if (restaurant) {

            response.status = "success";
            response.message = restaurant;

        } else {
            response.status = "fail";
            response.message = "No se actualizo su restaurante";
        }

    } catch (error) {

        response.status = "fail";
        response.message = error.message;

    }

    res.send(response)


});
//se actualiza mediante el idcategor y idbranchrestaurant los datos del branchrestaurant
router.post("/updateBranch", async(req, res) => {
    const response = new Object();
    const Op = Sequelize.Op;
    const body = req.body;

    try {

        var idbranch_Exist = await db.branch_restaurant.findByPk(
            body.idBranchRestaurant
        );

        if (idbranch_Exist) {
            var branch_restaurant = await db.branch_restaurant.update({
                name: body.name,
                isOpen: body.isOpen,
                phoneNumber: body.phoneNumber,
                address: body.address,
                latitude: body.latitude,
                longitude: body.longitude,
                priceMedium: body.priceMedium,
                webPage: body.webPage
            }, {

                where: {
                    [Op.and]: [
                        { idBranchRestaurant: body.idBranchRestaurant },
                        { idRestaurant: body.idRestaurant }
                    ]
                }

            });

            if (branch_restaurant) {
                response.status = "success";
                response.message = branch_restaurant;
            } else {
                response.status = "fail";
                response.message = "No se actualizo su branch";
            }

        } else {
            response.status = "fail";
            response.message = "404 branch not found";

        }

    } catch (error) {
        response.status = "fail";
        response.message = error.message;

    }
    res.send(response);
});
//esta en favorite.dart y restaurant_provider.dart sirve para insertar un like o para modificarlo el like de la comida
//tambien esta list_favorite_food.dart
router.post('/addlikefooduser', async(req, res) => {
    const response = new Object();

    try {

        finder = await db.food_user.findOne({
            where: { fkidFood: req.query.fkidFood, idUser: req.query.idUser }

        });

        if (finder) {

            var food_user = await db.food_user.update({
                like: req.query.like,
                fkidFood: req.query.fkidFood,
                idUser: req.query.idUser,

            }, {

                where: { fkidFood: req.query.fkidFood, idUser: req.query.idUser },

            });

            if (food_user) {
                response.status = "success";
                response.results = food_user;
            } else {
                response.status = "fail";
                response.results = "No se actualizo su comida";
            }

        } else {
            create1 = await db.food_user.create({
                like: req.query.like,
                fkidFood: req.query.fkidFood,
                idUser: req.query.idUser,
            });
            if (create1) {
                response.status = "success";
                response.results = create1;
            } else {
                response.status = "fail";
                response.results = "No se creo su comida";
            }

        }
    } catch (error) {
        response.status = "fail";
        response.results = error.message;
    }
    res.send(response);
});

//se actualiza mediante el idbranchrestaurant y idschedule los datos de los horarios de cada sucursal
router.post("/updateSchedule", async(req, res) => {
    const response = new Object();
    const Op = Sequelize.Op;
    const body = req.body;

    try {

        var idschedule_Exist = await db.restaurant_schedule.findByPk(
            body.idBranchRestaurant
        );

        if (idschedule_Exist) {

            var restaurant_schedule = await db.restaurant_schedule.update({
                day: body.day,
                startTime: body.startTime,
                endTime: body.endTime,
            }, {

                where: {
                    [Op.and]: [
                        { idBranchRestaurant: body.idBranchRestaurant },
                        { idRestaurantSchedule: body.idRestaurantSchedule }
                    ]
                }

            });

            if (restaurant_schedule) {
                response.status = "success";
                response.message = restaurant_schedule;
            } else {
                response.status = "fail";
                response.message = "No se actualizo su schedule";
            }

        } else {
            response.status = "fail";
            response.message = "404 schedule not found";

        }

    } catch (error) {
        response.status = "fail";
        response.message = error.message;

    }
    res.send(response);
});

//se actualiza mediante el idbranchrestaurant y idimagerestaurant los imagenes de cada sucursal pero no se borra la imagen en el storage
router.post("/updateImageBranch", async(req, res) => {
    const response = new Object();
    const Op = Sequelize.Op;
    const body = req.body;

    try {
        var idImage_Exist = await db.image_branch_restaurant.findByPk(
            body.idBranchRestaurant
        );

        if (idImage_Exist) {

            var image_branch_restaurant = await db.image_branch_restaurant.update({
                principal: body.principal,
                route: body.route,
            }, {

                where: {
                    [Op.and]: [
                        { idBranchRestaurant: body.idBranchRestaurant },
                        { idImageRestaurant: body.idImageRestaurant }
                    ]
                }

            });

            if (image_branch_restaurant) {
                response.status = "success";
                response.message = image_branch_restaurant;
            } else {
                response.status = "fail";
                response.message = "No se actualizo su imagen";
            }

        } else {
            response.status = "fail";
            response.message = "404 image not found";

        }

    } catch (error) {
        response.status = "fail";
        response.message = error.message;

    }
    res.send(response);
});



//se actualiza la comida mediante un idfood y un idfoodcategory

router.post("/updateFood", async(req, res) => {
    const response = new Object();
    const Op = Sequelize.Op;
    const body = req.body;

    try {

        var food = await db.food.update({
            name: body.name,
            description: body.description,
            price: body.price,
        }, {

            where: {
                [Op.and]: [
                    { idFood: body.idFood },
                    { idFoodCategory: body.idFoodCategory }
                ]
            }

        });

        if (food) {
            response.status = "success";
            response.message = food;
        } else {
            response.status = "fail";
            response.message = "No se actualizo su food";
        }



    } catch (error) {
        response.status = "fail";
        response.message = error.message;

    }
    res.send(response);
});
//estoy haciendo pruebas con este codigo hay q analizar a profundo 
router.get("/getLikeUserCount", async(req, res) => {
    const response = new Object();
    var user = await db.user.findOne(

        {
            group: ['fkidFood'],
            include: [{
                    model: db.food_user,
                    where: {
                        like: 1
                    },
                    required: false,

                },

            ],
            where: { idUser: req.query.idUser },

        }
    );
    if (user) {
        //const [results, metadata] = await sequelize.query("SELECT users SET y = 42 WHERE x = 12");
        //response.status="success";
        response.message = user;
    } else {
        response.status = "fail";
        response.message = "404 recipe not found";
    }
    res.send(response);
});

module.exports = router;
//////new recipes
////most voted
/////random