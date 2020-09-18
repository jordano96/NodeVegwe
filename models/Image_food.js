module.exports=(db,DataTypes)=>{

    const image_food=db.define('image_food',{

        idImageFood: { type: DataTypes.INTEGER, primaryKey:true, allowNull:false, autoIncrement:true },
        principal:{ type:DataTypes.INTEGER, allowNull:false},
        route:{ type:DataTypes.TEXT('long'), allowNull:false},
        idFood:{
            type:DataTypes.INTEGER,
            allowNull:false,
            references:{

                model:'food',
                key:'idFood'

            }
        }

    })

    return image_food;


}