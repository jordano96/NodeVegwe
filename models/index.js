'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const { DataTypes,Op } = require('sequelize');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.json')[env];
const db = {};

let sequelize;

if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js');
  })
  .forEach(file => {
    const model = sequelize['import'](path.join(__dirname, file));
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});


//ASSOCIATIONS

db.user_chat.hasOne(db.chat,{
  foreignKey: 'idChat',
  sourceKey: 'idChat',
  constraints:false
});
db.user_chat.hasOne(db.user, {
  foreignKey: 'idUser',
  sourceKey: 'idUser',
  constraints:false
});


db.recipe.hasMany(db.step_recipe,{
  foreignKey:'idRecipe'
});

db.recipe.hasMany(db.recipe_ingredient,{
  foreignKey:'idRecipe'
});

db.recipe.hasMany(db.image_recipe,{
  foreignKey:'idRecipe'
});

db.recipe_ingredient.hasOne(db.ingredient,{
  foreignKey:'idIngredient',
  sourceKey:'idIngredient',
  constraints:false
});

db.restaurant.hasMany(db.branch_restaurant,{
  foreignKey: 'idRestaurant',
 
});


db.branch_restaurant.hasMany(db.restaurant_schedule,{
  foreignKey: 'fkidBranchRestaurantSchedule',
  

});

//este no iba se le agrego

db.restaurant_schedule.belongsTo(db.branch_restaurant,{
  foreignKey: 'fkidBranchRestaurantSchedule',
});

db.food_category.hasMany(db.food,{
  foreignKey: 'idFoodCategory',
 

});

db.branch_restaurant.hasMany(db.image_branch_restaurant,{
  foreignKey: 'fkidBranchRestaurantImage',
  

});

//este no iba se le agrego

db.image_branch_restaurant.belongsTo(db.branch_restaurant,{
  foreignKey: 'fkidBranchRestaurantImage',
});


db.food.hasMany(db.image_food,{
  foreignKey: 'idFood',
 

});

db.branch_restaurant.hasMany(db.assessment_restaurant,{
  foreignKey: 'fkidBranchRestaurant',
  //as: 'fkidBranchRestaurant'
  
});
//este no iba se le agrego
db.assessment_restaurant.belongsTo(db.branch_restaurant,{
  foreignKey: 'fkidBranchRestaurant',
});



db.user.hasMany(db.assessment_restaurant,{
  foreignKey: 'idUser',
  
});

db.food.hasMany(db.food_branch,{
  foreignKey: 'idFood',
  
});

/*
 db.food_branch.hasMany(db.food,{
   foreignKey: 'idFood',
   sourceKey:'idFood',
   constraints:false

 });

 db.food_branch.hasMany(db.branch_restaurant,{
   foreignKey: 'idBranchRestaurant',
   sourceKey:'idBranchRestaurant',
   constraints:false
});*/


db.food_branch.belongsTo(db.food,{
  //foreignKey: 'idFoodBranch',
  foreignKey: 'idFood',
  //as: 'fkidFood'

}); 



db.food.hasMany(db.food_user,
  {foreignKey: 'fkidFood'}
  );

db.food_user.belongsTo(db.food,
  {foreignKey: 'fkidFood'}
  ); 

//en belong to el foreignkey le va a pertener al modelo fuente


db.food_branch.belongsTo(db.branch_restaurant,{
  foreignKey: 'fkidBranchRestaurantFB',
});


//en hasmany el foreignkey le va a pertener al destino
db.branch_restaurant.hasMany(db.food_branch,{
  foreignKey: 'fkidBranchRestaurantFB',
});

db.food_user.belongsTo(db.user,{
  foreignKey: 'idUser',
});


//en hasmany el foreignkey le va a pertener al destino
db.user.hasMany(db.food_user,{
  foreignKey: 'idUser',
});

db.assessment_restaurant.belongsTo(db.user,{
  foreignKey: 'idUser',
});

db.image_food.belongsTo(db.food,{
  foreignKey :'idFood'

});
db.food.belongsTo(db.food_category,{
  foreignKey: 'idFoodCategory',
});


db.sequelize = sequelize;
db.Sequelize = Sequelize;
db.op = Op;
module.exports = db;