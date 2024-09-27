const { Sequelize, DataTypes } = require("sequelize");
require('dotenv').config();

const sequelize = new Sequelize("amazon-scs", process.env.MYSQL_USERNAME, process.env.MYSQL_PASSWORD, {
    host: "localhost",
    logging: false,
    dialect: "mysql",
});

try {
    sequelize.authenticate();
    console.log("Connect has been established");
} catch (err) {
    console.log("Unable to connect: " + err.message);
}

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.user = require("../models/users")(sequelize, DataTypes);
db.file = require("../models/files")(sequelize, DataTypes);
db.directory = require("../models/directories")(sequelize, DataTypes);
db.permission = require("../models/filePermission")(sequelize, DataTypes);
db.fileVersion = require("../models/fileVersion")(sequelize, DataTypes);
db.fileMetadata = require("../models/fileMetaData")(sequelize, DataTypes);

// Table's associations
db.user.hasMany(db.file, { foreignKey: "user_id" });
db.file.belongsTo(db.user);

db.user.hasMany(db.directory, { foreignKey: "user_id" });
db.directory.belongsTo(db.user);

db.file.hasMany(db.fileVersion, { foreignKey: 'file_id', onDelete: 'CASCADE' });
db.fileVersion.belongsTo(db.file);

db.file.hasOne(db.fileMetadata, { foreignKey: 'file_id',  onDelete: 'CASCADE'});
db.fileMetadata.belongsTo(db.file);

db.file.hasOne(db.permission, { foreignKey: 'file_id',  onDelete: 'CASCADE'});
db.permission.belongsTo(db.file);

db.sequelize.sync({ force: false });
module.exports = db