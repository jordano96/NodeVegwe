module.exports=(db,DataTypes)=>{

    const food_branch=db.define('food_branch',{

        idFoodBranch:{type:DataTypes.INTEGER,primaryKey:true,allowNull:false,autoIncrement:true},
        
        idFood:{
            type:DataTypes.INTEGER,
            allowNull:false,
            references:{

                model:'food',
                key:'idFood'

            }
        },
        fkidBranchRestaurantFB:{
            type:DataTypes.INTEGER,
            allowNull:false,
            references:{

                model:'branch_restaurants',
                key:'idBranchRestaurant'

            }
        }


    })
    return food_branch;


}