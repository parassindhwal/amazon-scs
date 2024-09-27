module.exports = (sequelize, DataTypes) => {
  const File = sequelize.define("file", {
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    directory_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "directories",
        key: "id",
      },
    },
    file_name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: "File name is required",
        },
      },
    },
    file_type: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: "File type is required",
        },
      },
    },
    download_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  });

  return File
};
