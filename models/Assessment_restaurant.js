module.exports=(db,DataTypes)=>{

    const assessment_restaurant=db.define('assessment_restaurant',{

        idAssessmentRestaurant:{type:DataTypes.INTEGER, primaryKey:true,allowNull:false,autoIncrement:true},
        assessment:{type:DataTypes.DOUBLE,allowNull:false},
        commentary:{type:DataTypes.STRING(200),allowNull:true},
        fkidBranchRestaurant:{
            type:DataTypes.INTEGER,
            allowNull:false,
            references:{

                model:'branch_restaurants',
                key:'idBranchRestaurant'

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

    return assessment_restaurant;

}