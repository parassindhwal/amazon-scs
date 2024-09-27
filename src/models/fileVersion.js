module.exports = (sequelize, DataTypes) => {
  const FileVersion = sequelize.define(
    "File_Version",
    {
      file_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "files",
          key: "id",
        },
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      version_number: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      file_path: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      priority_version: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      file_size: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          notNull: {
            msg: "File size is required",
          },
        },
      },
      system_generated_file_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      upload_date: {
        type: DataTypes.DATE,
        allowNull: false
      }
    }
  );

  return FileVersion;
};
