module.exports=(db,DataTypes)=>{

    const restaurant_schedule=db.define('restaurant_schedule',{

        idRestaurantSchedule:{type:DataTypes.INTEGER, primaryKey:true,allowNull:false,autoIncrement:true},
        day:{type:DataTypes.INTEGER,allowNull:false},
        startTime:{type:DataTypes.TIME,allowNull:false},
        endTime:{type:DataTypes.TIME,allowNull:false},
        fkidBranchRestaurantSchedule:{
            type:DataTypes.INTEGER,
            allowNull:false,
            references:{

                model:'branch_restaurants',
                key:'idBranchRestaurant'

            }
        }

    })

    return restaurant_schedule;
}