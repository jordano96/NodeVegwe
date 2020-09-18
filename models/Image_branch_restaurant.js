module.exports=(db,DataTypes)=>{

    const image_branch_restaurant=db.define('image_branch_restaurant',{

        idImageRestaurant: { type: DataTypes.INTEGER, primaryKey:true, allowNull:false, autoIncrement:true },
        principal:{ type:DataTypes.INTEGER, allowNull:false},
        route:{ type:DataTypes.TEXT('long'), allowNull:false},
        fkidBranchRestaurantImage:{
            type:DataTypes.INTEGER,
            allowNull:false,
            references:{

                model:'branch_restaurants',
                key:'idBranchRestaurant'

            }
        }

    })

    return image_branch_restaurant;


}