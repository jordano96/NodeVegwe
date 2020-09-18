module.exports=(db,DataTypes)=>{

    const food=db.define('food',{

        idFood:{type:DataTypes.INTEGER,primaryKey:true,allowNull:false,autoIncrement:true},
        name: {type:DataTypes.STRING(100),allowNull:false},
        description:{type:DataTypes.STRING(300),allowNull:false},
        price:{type:DataTypes.DOUBLE,allowNull:false},
        
        idFoodCategory:{
            type:DataTypes.INTEGER,
            allowNull:false,
            references:{

                model:'food_categories',
                key:'idFoodCategory'

            }
        }


    })
    return food;


}