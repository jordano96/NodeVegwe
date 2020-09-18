//Branch_office = sucursal
module.exports=(db,DataTypes)=>{

    const branch_restaurant=db.define('branch_restaurant',{

        idBranchRestaurant:{type:DataTypes.INTEGER, primaryKey:true,allowNull:false,autoIncrement:true},
        name:{type: DataTypes.STRING(100),allowNull:false},
        isOpen:{type:DataTypes.BOOLEAN,allowNull:false},
        phoneNumber:{type:DataTypes.STRING(15),allowNull:false,defaultValue:'xxxxxxx'},
        address:{type:DataTypes.STRING(200),allowNull:false},
        latitude:{type:DataTypes.STRING(100),allowNull:false},
        longitude:{type:DataTypes.STRING(100),allowNull:false},
        priceMedium:{type:DataTypes.STRING(50),allowNull:false},
        webPage:{type:DataTypes.STRING(50),allowNull:true},
        idRestaurant:{
            type:DataTypes.INTEGER,
            allowNull:false,
            references:{

                model:'restaurants',
                key:'idRestaurant'

            }
        }
        
    })

    return branch_restaurant;



}

