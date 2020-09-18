module.exports=(db,DataTypes)=>{

    const restaurant=db.define('restaurant',{

        idRestaurant:{type:DataTypes.INTEGER,primaryKey:true,allowNull:false,autoIncrement:true},
        name: {type:DataTypes.STRING(100),allowNull:false},
        description:{type:DataTypes.STRING(500),allowNull:false},
        route:{ type:DataTypes.TEXT('long'), allowNull:false},

    });

    return restaurant;

}