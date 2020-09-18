module.exports=(db,DataTypes)=>{

    const food_user=db.define('food_user',{

        idFoodUser:{type:DataTypes.INTEGER,primaryKey:true,allowNull:false,autoIncrement:true},
        like:{type:DataTypes.BOOLEAN,allowNull:false},
        
        fkidFood:{
            type:DataTypes.INTEGER,
            allowNull:false,
            references:{

                model:'food',
                key:'idFood'

            }
        },
        idUser:{
            type:DataTypes.INTEGER,
            allowNull:false,
            references:{

                model:'users',
                key:'idUser'

            }
        }


    })
    return food_user;

}