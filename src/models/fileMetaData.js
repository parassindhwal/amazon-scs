module.exports = (sequelize, DataTypes) => {
  const FileMetadata = sequelize.define(
    "File_Metadata",
    {
      file_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "files",
          key: "id",
        },
      },
      metadata_key: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      metadata_value: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    }
  );

  return FileMetadata;
};
