module.exports=(db,DataTypes)=>{

    const food_category=db.define('food_category',{

        idFoodCategory:{type:DataTypes.INTEGER,primaryKey:true,allowNull:false,autoIncrement:true},
        name: {type:DataTypes.STRING(100),allowNull:false},
        route:{type:DataTypes.TEXT('long'),allowNull:false},
        
    })

    return food_category;


}